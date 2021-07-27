---
layout:      post
title:       "Alacrittyが日本語入力がおかしいのを直した"
subtitle:    "macOSのIME APIを叩く"
description: "日本語のインライン入力を行うためのTextInputClientにおいて実装のメモ"
date:        2021-07-20
author:      "Yusuke Kominami"
image:       "https://s3-ap-northeast-1.amazonaws.com/cdn.appli-world.jp/production/imgs/images/000/052/006/original.jpg?1542708167"
tags:        ["IME", "macOS"]
categories:  ["Tech"]
---

# 背景

先日なんとなく[ネットサーフィンしていたらターミナルアプリ一覧みたいな記事](https://zenn.dev/kawarimidoll/articles/007449407cc78d)を見かけた。
自分は今まで惰性でmacOSでデフォルトでついているターミナルアプリを使っていて、特に不満はなかった。
範囲選択したときのハイライトが弱くて見にくかったというのはあるが....

この記事を見て色々試して、最初に紹介されていたAlacrittyというのを使ってみることにした。
どうやらRust製ということで速いらしい。

早速試してみて、確かに速い。
ものすごく操作している感じが良く、URLをクリックするとブラウザに飛べるというありがたい機能も付いていた。

しかし完璧ではなくて、日本語のIMEとあまり相性が良くなかった。
具体的にどういう症状があったかというと、

- 予測変換している段階だとターミナル上に字が出てこない
- 予測変換の際に候補を矢印キーで選択するとコマンドヒストリーが起動してしまう

などの問題があった。

ただ、自分は基本的にターミナルでは英語しか打ち込まないので問題ないと判断し、Alacriittyを普段使いに採用することにした。

しかしやはり日本語入力が微妙なのは気になるもので、思い切って自分で直してみることにした。
気合を入れて本家のコードをforkしてきて「さあやってやるぞ」と手を入れ始めたのだが、これが地獄の入り口だった。

# Objective-C何もわからん問題

[Alacrittyのコード](https://github.com/alacritty/alacritty)を見てみると、GlutinというOpenGLユーティリティのようなクレートを使って画面を作ってるらしい。
つまりキー入力自体のハンドリングについては丸ごとそちら側に任せて、Alacritty自体はGlutinから受け取ったWindowEventをもとに表示をどうするかなどAPIを整えているという機能分割を行っていた。

Issueを眺めていくとどうやらIMEの問題については既知だったらしく、いくつかIssueが立っていた([Cannot input japanese characters #1101](https://github.com/alacritty/alacritty/issues/1101), [Support inline "input method" input #1613](https://github.com/alacritty/alacritty/issues/1613))

ディスカッションの様子を見ていると、どうやらAlacritty側に問題があるわけではなくWinitという低レベルOpenGLクレート側に問題があるらしい。

依存関係としては Alacritty > Glutin > Winit となっているのだが、Glutinは内部で `use winit::*` ということをしていて実質的に何もしておらず、結論としてWinitを直せばAlacrittyが直るとのこと。([#comment](https://github.com/alacritty/alacritty/issues/1101#issuecomment-649986976))

ということでWinitの中身を見てみるが、やっていたことはObjective-Cのコードをひたすらラップしていたのである。
もちろん最終的には使いやすい形となるようWindowEvent関連の綺麗なstructやenumがまとまっているが、OSごとの差分をうまいこと吸収するために色々泥臭いことが行われており、そのうちmacOSの場合に行われていたのがObjective-Cのラップだった。

ちなみに最初のこの時点でIMEについては全く知らないしmacOSネイティブのアプリ開発の経験も無いからmacOSでのIME APIなんて何も知らない。
おかげさまで最初はWinitのコードを書いても何もわからなかった。

# 調査を進めていく

何も知識が無くRustのコードが読み書きできる状態だったのでまずはコードを読んでわからない概念・単語を全てググっていく。

## NSViewとかNSTextView？てかNSって何の略？

コードを読んでいくとNSViewとかNSTextView、他にもNSRangeなどNSというPrefixがついた色々なものが出てくる。
もちろん知らない。

ググってみると以下の情報が出てきた。

> NeXTSTEP の権利がアップル社に移る時に開発言語のObjective-Cの権利もアップル社に移りました。そしてこのNeXTSTEPが現在のMac OS Xのベースになりました。また今から学習をはじめるObjective-Cには“NS”という文字で始まるクラスや関数が多数存在しています（クラスについては後の章で説明いたします）。このNSはNeXTSTEPの略称です。

かつてAppleを追われたスティーブ・ジョブズはNeXTという会社を作ってNEXTSTEPというOSを販売していたが、Appleに吸収されその技術をベースに現在のmacOSができあがったため、NS〇〇というのはNeXT社の由来というものらしい。([引用元](https://vivacocoa.jp/objective-c3e/chapter1a.html))

逆に、今回Winitのデバッグで出てくるオブジェクトでNSというPrefixがついていればWinitではなくmacOS側のオブジェクトということになる。

## IMEを使うにはNSTextInputClientプロトコルを実装する(?)

NSがmacOS側のオブジェクトというのはわかったが、ググってみると[NSTextInputClientプロトコルを実装すればIMEが機能するようになるらしい](https://qiita.com/496_/items/4ad166f4104d0bb24e80)。

プロトコルを実装するというのはピンとこなかったが、NSTextInputClientプロトコル内で使われる`hasMarkedText`や`selectedRange`、`insertText`などの関数をアプリケーション内で動くように実装すればいいらしい。

具体的に、例えば未確定文字列が存在するか確認する`hasMarkedText`は以下のように実装する。

```rust
extern "C" fn has_marked_text(this: &Object, _sel: Sel) -> BOOL {
    unsafe {
        trace!("Triggered `hasMarkedText`");
        let marked_text: id = *this.get_ivar("markedText");
        trace!("Completed `hasMarkedText`");
        (marked_text.length() > 0) as BOOL
    }
}
```

また、`setMarkedText`は以下のようになる。

```rust
extern "C" fn set_marked_text(
    this: &mut Object,
    _sel: Sel,
    string: id,
    _selected_range: NSRange,
    _replacement_range: NSRange,
) {
    trace!("Triggered `setMarkedText`");
    unsafe {
        let marked_text_ref: &mut id = this.get_mut_ivar("markedText");
        let _: () = msg_send![(*marked_text_ref), release];
        let marked_text = NSMutableAttributedString::alloc(nil);
        let has_attr = msg_send![string, isKindOfClass: class!(NSAttributedString)];
        if has_attr {
            marked_text.initWithAttributedString(string);
        } else {
            marked_text.initWithString(string);
        };
        *marked_text_ref = marked_text;
    }
    trace!("Completed `setMarkedText`");
}
```

この場合、事前に`NSView`オブジェクト内に`markedText`という変数を用意しておき、仮に日本語入力をしていて確定されてない文字列(未確定文字列、下線がついているやつ)があればOS側が`setMarkedText`を発火してこの`markedText`に値を当て、`hasMarkedText`はそれを参照する。

NSTextInputClientとはこのようにキーを押したイベントに際して文字列入力の際の一連の処理を行ってくれる規則であり関数の発火を行ってくれるもので、プロトコルを実装するとは実際のアプリケーションでIMEを叩くために各関数の具体的な動作を定義する必要があるのである。

# 試験的に動かす

今回Alacrittyを直すためだったが、修正に際して登場するクレートが3つもあるため、それぞれcloneしてくる。

ディレクトリの位置関係としては以下のようになる。

```
.
├── alacritty/
│   ├── alacritty/
│   ├── alacritty_config_derive
│   ├── alacritty_terminal
│   ├── docs
│   ├── extra
├── glutin
│   ├── glutin
│   ├── glutin_egl_sys
│   ├── glutin_emscripten_sys
│   ├── glutin_examples
│   ├── glutin_gles2_sys
│   ├── glutin_glx_sys
│   └── glutin_wgl_sys
└── winit
    ├── examples
    ├── src
    └── tests
```

そしてAlacrittyをローカルで叩くが、依存するクレートをcrates.ioからとってくるのではなくローカルのものをとってきて欲しいので`Cargo.toml`の依存クレートを以下のように直す。

```
glutin = { version = "0.27.0", default-features = false, features = ["serde"] }

↓

glutin = { path = "../../glutin/glutin", version = "0.27.0", default-features = false, features = ["serde"] }
```

これでローカルのものを参照してくれる。
Glutinでも同様にローカルのWinitを参照するように直す。

これらをやった上でAlacrittyのリポジトリで`cargo run`をすればターミナルが立ち上がる。

これで準備OKになった。

# NSTextInputClientの挙動を修正する

下調べなどでものすごく時間がかかってしまったが、ようやく作業に取り掛かる。

WinitではIMEの挙動を直すために色々structの仕様変更が入ったりしていたが、現在ではKeyboardInputというstructで未確定文字列の有無を格納するフィールドがある。
AlacrittyもWinitもIMEの修正に真っ最中らしく、Alacritty本体でもまだ未確定文字列の処理についてのハンドリングはfixされていない。(Alacrittyの中に`skip_events`という関数があり、その中に`KeyboardInput { is_synthetic: true, ..}`がある)

今回動作確認するためにはまずAlacrittyがハンドリングするWindowEventで未確定文字列が存在する場合もキャッチして処理するよう[パターンマッチングの分岐条件](https://github.com/alacritty/alacritty/blob/4c9ecd3479b6cce0493532561ef78ba410c3b51a/alacritty/src/event.rs#L1250)を変更する。

```rust
WindowEvent::KeyboardInput { input, is_synthetic: false, .. } => {
    processor.key_input(input);
},

↓

WindowEvent::KeyboardInput { input, .. } => {
    processor.key_input(input);
},
```

次にWinitにて適切に`KeyboardInput`というstruct内に`is_synthetic`のboolが適切に入っているか確認する。

が、見てみるとmacOSについてはまだ暫定的に全てfalseでは入るようになっている。
macOSについてはまだIME対応が完了していない中でstructの仕様を変更が入った経緯ということで、このようなコードになっていた。

一旦これをいじって直して、早速実際のIMEのコードの修正に取り掛かる。

## `setMarkedText`と`insertText`と`doCommandBySelector`

IMEの修正にはmacOSのAPIを叩いているコードを障ればよく、Winitの[`src/platform_impl/macos/view.rs`](https://github.com/komi1230/winit/blob/master/src/platform_impl/macos/view.rs)がそれに該当する。

コードの見方として、中段くらいにある`lazy_static! { ... }`の部分でクラスの宣言を行なっていてこの中にクラスメソッドや変数の宣言を行う。
宣言された関数についてはその後`extern "C" fn ...`のようにして具体的な関数の実装を行う。

宣言されたクラスメソッドは色々あるが、この中でキー入力を担うのが`setMarkedText`と`insertText`と`doCommandBySelector`の3つで、それぞれの役割として

| 関数名 | 役割 |
| :--: | :--: | 
| `setMarkedText` | 日本語などの入力の際に未確定の文字列をどう扱うかを決める。 |
| `insertText` | 確定文字列をフロントエンドに送る。英語入力の際はデフォルトでこれになる。 |
| `doCommandBySelector` | Cmd-sみたいなキーバインド。文字入力ではなくウィンドウ操作などが対象。 |

となっている。
文字列をフロントエンドに渡す操作は`setMarkedText`と`insertText`が担っている。

## `setMarkedText`でフロントに都度入力する

フロントエンドに文字列を渡す方法として、以下のようにイベント情報のキューにpushしていく。

```rust
let mut events = VecDeque::with_capacity(characters.len());
events.push_back(EventWrapper::StaticEvent(Event::WindowEvent {
    window_id: WindowId(get_window_id(state.ns_window)),
    event: WindowEvent::ReceivedCharacter(character),
}));

AppState::queue_events(events);
```

この中の`event: WindowEvent::ReceivedCharacter(character)`が肝で、`insertText`ではこのような操作を行なってくれているのだが`setMarkedText`はこの実装が行われていなかった。過去のログを探ってみたところ、どうやら実装者が英語圏の人で`setMarkedText`が何のためにあるのか知らなかったらしい。

そんなわけで`setMarkedText`にも毎度フロントに文字列をpushするように変更。
`setmarkedText`は各キー入力に対して毎回発火するので、全部入力するようにしていると`ねこ`と入力したら`nねねkねこ`と何度も入力されまくることになる。
そのため毎回`setMarkedText`が起動すると同時に直前の未確定文字列分だけDeleteキーを押す操作を擬似的に行わせる。

この操作として直前のカーソル位置の分だけまず全部削除して、その後新規の未確定文字列を全部入力させるという方針を取る。
つまり

```
こんにちh
↓
(全部削除)
↓
こんにちは
```

とした。
これで重複を無くすことができる。

一つ要注意ポイントとして、Rustでは文字列型として`String`と`&str`があるが、これらに対して`text.len()`としてもUTF-8のデータ長が帰ってきてしまう。
つまり`"こんにちは".len()`の値は`15`となってしまう。
そのため文字数をカウントする場合は`"こんにちは".chars().count()`を使うのが正しい。

## `insertText`と`setMarkedText`の二重発火

これで完成かというとそうでもなく、macOSのAPIとして未確定文字列がある場合は毎回のキー入力に対して`setMarkedText`が起動するが、未確定文字列が確定された時は`insertText`が起動する。
つまりこのままだと`こんにちは`と入力した際に`こんにちはこんにちは`と2回入力される。
これを防ぐべく、`isIMEActivated`という状態を示す変数をViewクラスに実装し、未確定文字列がある場合はtrueとなるようにした上で、これを起点に`insertText`の処理を適切にスキップさせれば良い。

## 予測変換への対応

日本語入力を考えた時、漢字への変換などがある。
この変換は多くの場合はSpaceキーや矢印キーを用いて行われる(はず)なのだが、現状のままだと予測変換のためにSpaceキーを押したのに空白が入力されてしまったり、もしくは矢印キーを触ってコマンドヒストリーを取りに行ってしまったりする。

そのため予測変換のためのキー操作をしているとき(未確定文字列が存在しているとき)、Spaceキーや矢印キーが押されたときは別の動作をさせる必要がある。
この処理は`keyDown`の実装をいじれば良く、自前で`is_arrow_or_space_key`のような関数を実装した上で、適切に処理をさせれば良い。

以上でようやくmacOSにてAlacrittyでIMEが有効化されるようになった。

# まとめ

今回バグを直すためにIMEってナニソレ状態から調査を始めて、無事にバグを修正するところまで持っていけた。

CocoaやAppkitの周辺の日本語情報はあまり転がっていなかったのでなかなか苦労したが、とても良い経験になった気がする。

最後に出したPRは[こちら](https://github.com/rust-windowing/winit/pull/1979)。