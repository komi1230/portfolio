+++
title="	Actix-webでAPIサーバーを立てる"
date=2020-07-28
+++

現在ちょっとしたカレンダーアプリを作っており、バックエンドにはRustを採用している。

リポジトリは[ここ](https://github.com/komi1230/calendar/tree/master/backend)から。

フレームワークにはActix-webを採用しており、今回バックエンドサイドはある程度書き上がったのでその所感をまとめてみようと思う。

### ミニマム

とにかく全体的に感じたのが、とにかくミニマムで取り回しやすいなという感じがした。

マクロ等を利用したルーティングやURIディスパッチ、各種ミドルウェアの実装などをほんの数行で実現でき、簡易的なAPIサーバーを実装するにはかなり良いと思う。

例えばマクロによるルーティングとURLディスパッチについて、自分も今作っているカレンダーアプリではこんなコードがある。

```rust
#[get("/user/{username}")]
pub async fn schedule_content(
    info: web::Path<UserData>,
    pool: web::Data<DbPool>,
) -> impl Responder {
    let conn = pool.get().expect("couldn't get db connection from pool");
    let res = Schedule::get_schedule(info.username.clone(), &conn);

    match res {
        Ok(contents) => web::Json(contents),
        Err(_) => panic!("Not found schedule"),
    }
}
```

 URLで`/user/{username}`として任意の文字列usernameに対して適当なコンテンツを打ち返すというのがこの関数の動作だけども、

+ `#[get(...)]`という属性マクロを用いてルーティングを定義し、
+ `info: web::Path<UserData>`として引数にURLのディスパッチを行う

ということができている。

例えばこれをPythonのFlaskとかでやろうとするならもう少しコード量が必要になると思われる。

別にPythonのFlaskでも良い感はあるが、やはりRustには型による安心感がある。

実際、今回は`{username}`という任意の文字列を`UserData`という型(構造体)に押し込めており、こちらとして事前に用意しておいたメソッドを適用させることなどができる。

もちろん、場合によってはディスパッチされる型を整数型として受け取ることも可能である。

こうした型の安全性とシンプルなコードを高いレベル両立できるのはやはりすごいと思う。

### 拡張性

今回のバックエンドとしてはそこまで複雑な動作をさせているわけではないが、地味にDBへの連携などの処理がある。

その点、Actix-webはHTTPサーバーとしての処理とRust内部でのデータ処理のフェイズを綺麗に分けられているので、DieselなどのORMとの橋渡しが思ったよりスムーズにできた。

正直なところDieselがORMとしてどうなのかという点については多少の文句はあるのだけど(やはりPythonのSQLAlchemyが最高な気がする)、Actix-webに関しては言えばそこらへんを非常に良く分業できているので、開発していてとてもユーザー体験が良かったと思う。

実際、[チュートリアル](https://actix.rs/docs/databases/)にもDieselとの接続について簡単なデザインパターンが載っており、これは初学者にとっては心強いと思う。

これ以外に、CSRF対策なども数行挟み込めばなんとかなる。

```rust
use actix_web::middleware::csrf;

fn handle_post(_req: HttpRequest) -> &'static str {
    "This action should only be triggered with requests from the same site"
}

fn main() {
    let app = Application::new()
        .middleware(
            csrf::CsrfFilter::build()
                .allowed_origin("https://www.example.com")
                .finish())
        .resource("/", |r| {
            r.method(Method::GET).f(|_| httpcodes::HttpOk);
            r.method(Method::POST).f(handle_post);
        })
        .finish();
}
```

他にもHTTP/2.0とかWebSocketあたりの先進的なWebの技術についてもしっかりカバーされており、やはり強い。

### 非同期

やはりActix-webについてはこれが嬉しい。

async/awaitを特に意識することなくサクッと実装でき、これは何よりも嬉しいポイントだと思う。

開発者サイドからは非同期処理特有のめんどくさい部分がRustのasync構文によってtokioのランタイムをフル活用でき、ストレスなく非同期処理を実装できる。

### 困ってないけど困りそうなポイント

今回はActix-webでAPIサーバーを実装したわけで、割と開発がサクサク進んだので特に困ったポイントなどは無いのだけど、こういうケースだと少し困るかな、という点を上げておこうと思う。

+ 機能モリモリなMVCフレームワークではない

DjangoやRailsの場合、データベースやフロントの方までフレームワークが管理しており、フレームワークが敷いたレールの上をしっかり歩めば良いというのが根幹の思想としてある。

一方で、今回扱ったActix-webについてはそうした完全に全部をカバーするという思想ではなく<b>必要な機能を必要な分だけ使う</b>というイメージである。

なので、例えばテンプレートエンジンなど込みで一つのフレームワークに乗っかって全て完結させたいんだーという場合において、Actix-webを含めて現存するRustのフレームワークでは実現が難しいポイントだと思う。

ただ、これについては個人的には問題ないと思っていて、というのもRustはとにかくシンプルにプロダクトを作成するという点においてかなり強みを発揮すると考えている。

故にRustは疎結合な構成のWebアプリで使われると思っていて(そっちの方が型周りの良さが出てくると思う)、今のところそういう機能モリモリなMVCフレームワークはないし、これからもそういうのは登場する必要はないかなと思う。

今後もWeb開発においてRustは局所的に高速に非同期処理したい場合で活躍していくと思う。

### まとめ

今回はActix-webで実装をしてみた所感については簡単にまとめてみた。

色々偉そうな感じのことを言ってしまっており、もしかしたら間違いがあるかもしれないので、その場合は後学やコミュニティのためにも指摘してもらえると嬉しい。

今後もRustで開発していこうと思う。
