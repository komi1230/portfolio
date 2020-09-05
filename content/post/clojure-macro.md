+++
title="Clojureのリーダマクロをざざっと理解する"
date=2019-10-30
+++

引き続きClojureのお勉強。

前回はClojureで簡単なメッセージを通信するHTTPサーバーを立てるところまでやった。

今回はそこから発展してミドルウェアの作成などをやろう.....と思っていたのだけれど、色々なWebサイトを参考にしてちょこちょこコードを読んでいたところリーダマクロがわからず<b>なんだこれ...?</b>となることが多々あった。

そこで今回はClojureでサーバーを構築する云々から一度離れてClojureのリーダマクロをささっとまとめておこうと思う。

### リーダマクロって？

リーダマクロは接頭辞や接尾辞に何か文字を付け加えることで別の式に展開することを可能にするマクロ文字のこと。

例えばラムダ式の定義においてClojureだと

```clojure
user=>  ((fn [x y] (+ x x)) 10 20)
;; 30
```

だったりするが、これはリーダマクロ`#()`を使うことで

```clojure
user=> (#(+ %1 %2) 10 20)
;; 30
```

という感じになる。

ちなみにこの例での`%`は引数の順番を表し、`%1`は第一引数のこと。第一引数は`%`としてもオッケー。

こんな感じのマクロ文字がたくさんあるのだけれど、Clojure言語の実装を見てるとだいたいお気持ちが掴めてくるので以下ではそこらへんについてまとめていく。

### Clojure言語のソースコードを見る

ClojureはJavaで実装されていて、リーダマクロあたりについては以下のあたりのコードに実装されている。

[https://github.com/clojure/clojure/blob/master/src/jvm/clojure/lang/LispReader.java#L90-L120:embed:cite]

中身はこうなっている。

```java
	 macros['"'] = new StringReader();
	macros[';'] = new CommentReader();
	macros['\''] = new WrappingReader(QUOTE);
	macros['@'] = new WrappingReader(DEREF);//new DerefReader();
	macros['^'] = new MetaReader();
	macros['`'] = new SyntaxQuoteReader();
	macros['~'] = new UnquoteReader();
	macros['('] = new ListReader();
	macros[')'] = new UnmatchedDelimiterReader();
	macros['['] = new VectorReader();
	macros[']'] = new UnmatchedDelimiterReader();
	macros['{'] = new MapReader();
	macros['}'] = new UnmatchedDelimiterReader();
//	macros['|'] = new ArgVectorReader();
	macros['\\'] = new CharacterReader();
	macros['%'] = new ArgReader();
	macros['#'] = new DispatchReader();
```

これを見てみると`#`にディスパッチマクロが割り当てられており、ディスパッチマクロについては以下の通りに定義されている。

```java
	 dispatchMacros['^'] = new MetaReader();
	dispatchMacros['#'] = new SymbolicValueReader();
	dispatchMacros['\''] = new VarReader();
	dispatchMacros['"'] = new RegexReader();
	dispatchMacros['('] = new FnReader();
	dispatchMacros['{'] = new SetReader();
	dispatchMacros['='] = new EvalReader();
	dispatchMacros['!'] = new CommentReader();
	dispatchMacros['<'] = new UnreadableReader();
	dispatchMacros['_'] = new DiscardReader();
	dispatchMacros['?'] = new ConditionalReader();
	dispatchMacros[':'] = new NamespaceMapReader();
```

ディスパッチマクロとは、この場合<b>マクロ文字`#`以降では別の式に変換するよー</b>というような機能を持ったマクロで、リーダマクロの二段重ねくらいの認識で大丈夫なはず。

さて、早速中身を見ていこうと思う。

#### ダブルクオーテーション`"`とセミコロン`;`

```java
	 macros['"'] = new StringReader();
	macros[';'] = new CommentReader();
```

これについては変数名の通りで、`"`は文字列を認識し`;`はコメントにするものである。

実際にClojureのコードでは

```clojure
(println "Hi Clojure !")
;; (println "This is a just comment")
```

という感じになっている。

#### シングルクオーテーション`\'`

<s>次の`\'`はシングルクオーテーションで、これはLisperにはお馴染みのシンボルを表す。</s>

ClojureのシンボルはCommon Lispとは挙動が異なり、Common Lispではシンボルは値を内包していてシンボルと値が同一であるのに対し、Clojureはシンボルと値がそれぞれ独立で、それぞれを名前空間がマッピングしているという構造を持っているらしい。

変数がunboundになることを想定したときシンボルと値は分けた方が都合がよいのでこのような構造をとっているらしく、ここらへんの挙動についてはRich HickeyのSimple made easyという哲学に基づいているもの、なんだとか。

少し難しいが、ここらへんも勉強していかないとなぁという感じ。

ご指摘いただいた[@lagenorhynque](https://twitter.com/lagenorhynque)さんありがとうございました！！！

```clojure
(def x 10)
(println x) ; => 10
(println 'x) ; => x
(println (quote x)) ; => x
```

#### アットマーク`@`

さて、次の`@`はCommon Lispの畑からやってきた人間にとってはあまり見慣れないもの。

Clojureには並行処理をサポートしていて、その際に変数を参照して展開することをこの`@`は行ってくれる。

<b>ref</b>が参照なら<b>deref</b>が参照はずし(展開するといった方が正確？)

```clojure
(def x (ref 10))
(println x) ; => #object[clojure.lang.Ref 0x17aabeae {:status :ready, :val 10}]
(println @x) ; => 10
(println (deref x)) ; => 10
```

ちなみにこの`@`は遅延評価でも有効らしく、

```clojure
(def x (delay 10))
(println x) ; => #object[clojure.lang.Ref 0x17aabeae {:status :pending, :val 10}]
(println @x) ; => 10
(println x) ; => #object[clojure.lang.Ref 0x17aabeae {:status :ready, :val 10}]
```

この場合、遅延評価によって実行の前後でステータスがpendingからreadyに変化しているに注意。

#### キャレット`^`

これもまたCommon Lisperには見慣れないもので、Clojureでは実際の変数に対してコンパイル時の型の情報や名前空間などのメタ情報を付加することができる。

実際、変数をprivateかpublicかのアクセス制限をかけるとき

```clojure
(def ^:private x 10)
(def ^{:private true} x 10 ;; 上と同じ
```

としたり、もしくは型の情報(型ヒント)を明記するとき

```clojure
(defn- foo [^long i ^long j] (+ i j))
```

とすればオッケー。

実際にメタ情報を見ようとするなら

```clojure
(def ^:private x 10)
(meta (var x)) 
;; {:private true, :line 1, :column 1, :file "/private/var/..."
(meta #'x)
```

として見れる。

ここで変数xについて`'x`がただのシンボルだが`#'x`はまた特殊で、Clojure では変数や関数の実体への参照として var というものがある。

よってREPLにて

```clojure
(def x 10)
(println x)
(println 'x)
(println (var x))
```

として見てみると`(var x)`が名前空間から参照しているのがわかると思う。

ここらへんは解説するとクソ長くなるのと自分がまだ完全理解してないのでここらへんで切り上げることにする。

#### バッククオーテーション`` ` ``とチルダ`~`

バッククオーテーションは式全体をシンボル化し、`~`はクオートを外す。

Common Lispだとアンクオートはカンマ`,`だったけどClojureではチルダ`~`になっているらしい。

さて、ここらへんは難しくないのでささっと。

```clojure
(def x 10)
(println `(1 x)) ; => (1 x)
(println `(1 ~x)) ; => (1 10)
```

ちなみにここでクオートされたリストに対してアットマーク`@`を組み合わせると括弧を外すことができる。

```clojure
(def y '(2 3))
(println `(1 ~@y) ; => (1 2 3)
```

なんでこんなことができるのかというと、`~@`がUnquoted Splicingというリーダマクロだから。

Lispすごい。

#### 括弧とか`(` `)` `{` `}` `[` `]`

ここらへんはリストとか集合とかベクトルとかのデータ型。

めんどくさいので省略。

#### シャープ+チルダ`#^`

メタデータを付加することができるが、先述のキャレット`^`単体と何が違うとかというと、`#^`では独自のkey/valueをメタデータとして付与できる。

...というのがClojure1.1とか1.2とかあたりの話らしい。

なんでも、Clojure1.1ではキャレット`^`は非推奨で`#^`を推奨していたらしい。

しかし手元で試してみたら普通にキャレット`^`単体でも独自のkey/valueがメタデータとして付与できて、なんだかよくわからない。

どういう使い分けなんだろう？

```clojure
(def #^{:fuck-kyoto-univ 114514} x 10)
(meta #'x)
```

うーん、難しい。

> 追記. Clojure1.10.1では`#^`はdeprecatedとなっているらしく、挙動自体は`#^`と`^`は変わらないらしい。

#### シャープ+シャープ`##`

これはInfなどを表すものらしい。

```clojure
(/ 1.0 0.0) ; => ##Inf
```

#### シャープ+シングルクオーテーション`#'`

これは`(var x)`と同じこと。

さっきやった。

#### シャープ+ダブルクオーテーション`#"..."`

はい！出ました！みんな大好き正規表現！！！

Pythonだと最初に`import re`とかやって正規表現ライブラリを引っ張ってきて...みたいな感じでやるけどClojureではデフォルトで正規表現を使えるのでなんと幸せなことだろうか....!!

```clojure
(re-find #"\d+" "abc12345def") ; => "12345"
(re-matches #"hello, (.*)" "hello, world") ; => ["hello, world" "world"]
```

中の正規表現エンジンが先読みとか再帰とかのイケてるやつまでサポートしてるのかは知らないけど、Javaの正規表現のやつをラップしてる感じらしいので多分サポートしてるはず。

#### シャープ+括弧`#(...)`

これはこのエントリーの最初の例にやったので省略。

#### シャープ+波括弧`#{...}`

集合ね。省略。

#### シャープ+イコール`#=`

これは`#=`に続くフォームを評価するもので

```clojure
#=(+ 1 2 3) ; => 6
(read-string "#=(+ 1 2 3)") ; => 6
```

というような感じ。

一つ注意点として`*read-eval*`がfalseになっている場合このリードマクロは機能しない。

```clojure
(binding [*read-eval* false] (read-string "#=(+ 1 2 3)")) 
; => 計算できませーん
```

#### シャープ+エクスクラメーションマーク`#!`

コメントになるらしい。

シェバンとかで使えそう。

```clojure
#!(+ 1 2 3) ; => 反応なし
```

#### シャープ+小なり大なり`#<...>`

これは以下のformを例外をThrowしてくれるらしい。

例えば`(atom 42)`をREPLで評価すると`#<Atom: 42>`とprintされ、これはUnreadableで評価されないものなんだよー的なことが他のサイトに書いてあったけどなんだかよくわからない。

参照 : [CLJSのUnreadbleのページにて](https://cljs.github.io/api/syntax/unreadable)

#### シャープ+アンダーバー`#_`

これはコメントの扱いになるらしい。

つまり読まれず評価されない。

```clojure
#_(+ 1 2 3) ; => 反応なし
```

#### シャープ+クエスチョンマーク`#?`

環境非依存なコードを書くために、環境ごとに条件分岐をしてくれるものらしい。

どういうことかというと、例えば以下のコードで

```clojure
#?(:clj "Hi !" :cljs "Hello !")
```

実行がClojureなら`Hi !`とprintされ、ClojureScriptなら`Hello !`とprintされるらしい。

そういえばClojureScriptなんてものあったな....(Clojureに入門してそこまで時間たってない顔)

とりあえずこのディスパッチマクロはそういうものらしい。

#### シャープ+コロン`#:`

まず、コロン`:`はキーワード指定子であり、コロン+コロン`::`は現在の名前空間にキーワードを紐付けるものである。

その前提で、シャープ+コロン`#:`は名前空間にキーワードをまとめて紐づけることができる。

具体的に、

```clojure
#:person{:first "Han"
         :last "Solo"
         :ship #:ship{:name "Millennium Falcon"
                      :model "YT-1300f light freighter"}}
```

は以下のように読み替えられる。

```clojure
{:person/first "Han"
 :person/last "Solo"
 :person/ship {:ship/name "Millennium Falcon"
               :ship/model "YT-1300f light freighter"}}
```

さて、コロン+コロン`::`は現在の名前空間にキーワードを紐付けるので`#::`も同様に

```clojure
(ns rebel.core
  (:require
    [rebel.person :as p]
    [rebel.ship   :as s] ))

#::p{:first "Han"
     :last "Solo"
     :ship #::s{:name "Millennium Falcon"
                :model "YT-1300f light freighter"}}
```

は以下の通りとなる。

```clojure
{:rebel.person/first "Han"
 :rebel.person/last "Solo"
 :rebel.person/ship {:rebel.ship/name "Millennium Falcon"
                     :rebel.ship/model "YT-1300f light freighter"}}
```

### まとめ

意外とリーダマクロはそこまで多くないらしい。

ただ、いくつか挙動が謎なものもあって、自分でコードを書くときは不安だけどコードを読む分には最低限は大丈夫そう。

ところでメタデータで型情報を渡したらコンパイルとか速くなるものなんだろうか？

あくまで型ヒントみたいな感じでPythonのType Hintingみたいにコードに虚無を植え付けるだけとかだと感情も虚無になってしまうので....

とりあえずだんだんとClojureが楽しくなってきた。

さあこれからもがんばるぞい！
