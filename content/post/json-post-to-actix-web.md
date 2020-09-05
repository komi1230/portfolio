+++
title="	Actix-webで作ったAPIサーバーにJSONをPOSTする"
date=2020-08-24
+++

### TL; DR

`serde_json`は、curlコマンドでシングルクオーテーションとダブルクオーテーションの順序を気にするらしく

```
curl -X POST -H "Content-Type:application/json" \                                                           master
-d "{'username': 'komi'}" \
http://localhost:8000/search
```

はダメで

```bash
curl -X POST -H "Content-Type:application/json" \                                                           master
-d '{"username": "komi"}' \
http://localhost:8000/search
```

はオッケーらしい。

### 状況

Actix-webでAPIサーバーを開発していて、POSTするAPIを書いてみたのだが、テストコードは動いてるのに手元で`curl`で叩いてみるとなぜか動かない現象に遭遇した。

コードは以下の通り。

```rust
use diesel::prelude::*;
use diesel::r2d2::{self, ConnectionManager};
use dotenv::dotenv;
use std::env;

pub type DbPool = r2d2::Pool<ConnectionManager<PgConnection>>;

pub fn make_pool() -> DbPool {
    dotenv().ok();
    let database_url = env::var("DATABASE_URL").expect("DATABASE_URL must be set");

    let manager = ConnectionManager::<PgConnection>::new(database_url);
    r2d2::Pool::builder()
        .build(manager)
        .expect("Failed to create pool.")
}

#[post("/search")]
pub async fn search_user(info: web::Json<UserData>, pool: web::Data<DbPool>) -> impl Responder {
    let conn = pool.get().expect("couldn't get db connection from pool");
    let res = Schedule::get_schedule(info.username.clone(), &conn);

    match res {
        Ok(content) if content.len() > 0 => web::Json(Info { result: true }),
        _ => web::Json(Info { result: false }),
    }
}
```

ターミナルで叩いたコマンドは

```bash
curl -X POST -H "Content-Type:application/json" \                                                           master
-d "{'username': 'komi'}" \
http://localhost:8000/search
```

エラーメッセージは以下の通り。

```
[2020-08-24T12:20:50Z DEBUG actix_web::types::json] Failed to deserialize Json from payload. Request path: /search
[2020-08-24T12:20:50Z DEBUG actix_web::middleware::logger] Error in response: Deserialize(Error("key must be a string", line: 1, column: 2))
[2020-08-24T12:20:50Z INFO  actix_web::middleware::logger] 127.0.0.1:53552 "POST /search HTTP/1.1" 400 0 "-" "curl/7.64.1" 0.000690
```

どうやらJSONのロードに失敗しているらしい。

しかしテストコードは動いている。

なぜだろうかと考えて、Actix-webのサンプルなどを叩いてみたところ、そちらは動く。

ひょっとしたら`r2d2`が何か悪さをしているのかと調べてみるが、これは問題ないらしい。

そうこうして調べてるうちに、テキトーにコピペしてみたコマンドが動いたり動かなかったりするのを発見。

結局のところ原因は何だったかというと、シングルクオーテーションとダブルクオーテーションの順序だった。

つまり

```bash
"{'username': 'komi'}"
```

はダメで、

```bash
'{"username": "komi"}'
```

はオッケーらしい。

自分は今までシングルクオーテーションとダブルクオーテーションの順序などあまり気にしたことがなかったので、今回このようなケースにハマって微妙な時間を溶かした。

そりゃ確かにテストコードは通ってもコマンドは動かない。

ということで原因は見つかって、自分もちょっと学びになった。
