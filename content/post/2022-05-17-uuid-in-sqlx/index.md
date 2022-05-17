---
layout: post
title: SQLxのUuid型はSerializeできない
subtitle: SQLxのUuid型とuuidクレートのUuidの違い
description: SQLxにてUuid型を使いたい場合はuuid型を使ってうまいことハンドリングしてあげる必要がある
date: 2022-05-17
author: Yusuke Kominami
image: "https://upload.wikimedia.org/wikipedia/commons/c/c8/Altja_j%C3%B5gi_Lahemaal.jpg"
tags:
  - rust
categories:
  - tech
---

# `sqlx::types::Uuid` vs `uuid::Uuid`

RustでDBに接続するための有用なクレートとしてSQLxがある。
かつてはDieselが有名だったが、async対応ができてないなどの理由から新興のSQLxの方が今は人気がある。

そんなSQLxだが、SQLxクレートがDBに対応した型を一部提供してくれている。その中に`Uuid`型があるのだが、これが結構クセモノだったりする。

というのも、Webアプリケーションを作成するときはDBから得られた`Uuid`型のデータをJSONとして変換してクライアント側に返却するというのはよくあることだが、SQLxが提供する`Uuid`型は`Serialize`が実装されていないので構造体をそのままJSONに変換することができない。

以下のコードを考えてみる。

```rust
use anyhow::{Context, Result};
use serde::{Deserialize, Serialize};
use sqlx::{postgres::PgRow, Pool, Postgres, Row};
//use uuid::Uuid;

#[derive(Debug, Deserialize, Serialize, sqlx::FromRow)]
pub struct UserAccessToken {
    pub user_id: i64,
    pub access_token: sqlx::types::Uuid,
}

pub fn register_user(id: i64) -> Result<UserAccessToken> {
  sqlx::query(
  r#"
    INSERT INTO users (id) VALUES ($1)
    RETURNING id, access_token
  "#,
  )
  .bind(some_id)
  .map(|row: PgRow| UserAccessToken {
      user_id: row.get(0),
      //access_token: Uuid::from_u128(row.get::<sqlx::types::Uuid, _>(1).as_u128()),
      access_token: row.get(1),
  })
  .fetch_one(pool)
  .await
  .context("Creating user")
}
```

SQLxでクエリを発行する際は`query_as`が有用だが、今回は明示的に型変換を行うため`query`を使っている。

このコードで肝となるのは`.map(|row| UserAccessToken { ... })`の部分で、構造体として`access_token`フィールドは`sqlx::types::Uuid`型を指定している。

このコードはコンパイルは通らず、エラーメッセージは

```
the trait bound `sqlx::types::Uuid: Deserialize<'_>` is not satisfied
the trait `Deserialize<'_>` is not implemented for `sqlx::types::Uuid`
```

を吐く。
これは`sqlx::types::Uuid`は`Serialize/Deserialize`を実装していないからである。

では`access_token`フィールドの型を`uuid::Uuid`とし、`.map(...)`の中はそのままにしてみる。
このとき`uuid`クレートのfeaturesにserdeを入れるのを忘れずに。

```rust
#[derive(Debug, Deserialize, Serialize, sqlx::FromRow)]
pub struct UserAccessToken {
    pub user_id: i64,
    pub access_token: uuid::Uuid,
}

pub fn register_user(id: i64) -> Result<UserAccessToken> {
  sqlx::query(
  r#"
    INSERT INTO users (id) VALUES ($1)
    RETURNING id, access_token
  "#,
  )
  .bind(some_id)
  .map(|row: PgRow| UserAccessToken {
      user_id: row.get(0),
      //access_token: Uuid::from_u128(row.get::<sqlx::types::Uuid, _>(1).as_u128()),
      access_token: row.get(1),
  })
  .fetch_one(pool)
  .await
  .context("Creating user")
}
```

これはどうなるかというと、これもコンパイルが通らない。
エラーメッセージは以下の通り。

```
the trait bound `uuid::Uuid: sqlx::Decode<'_, Postgres>` is not satisfied
the trait `sqlx::Decode<'_, Postgres>` is not implemented for `uuid::Uuid`
```

`uuid`クレートの`Uuid`型はSQLxが提供する`Decode`を実装してないためである。

JSONにデシリアライズすることはできてもDBからデータを構造体にシリアライズできない。

ということで折衷案として以下のように、DBからデータの受け渡しは`sqlx::types::Uuid`で受け、それを一度`u128`に変換し、これを`uuid::Uuid`に持っていく必要がある。

```rust
#[derive(Debug, Deserialize, Serialize, sqlx::FromRow)]
pub struct UserAccessToken {
    pub user_id: i64,
    pub access_token: uuid::Uuid,
}

pub fn register_user(id: i64) -> Result<UserAccessToken> {
  sqlx::query(
  r#"
    INSERT INTO users (id) VALUES ($1)
    RETURNING id, access_token
  "#,
  )
  .bind(some_id)
  .map(|row: PgRow| UserAccessToken {
      user_id: row.get(0),
      access_token: uuid::Uuid::from_u128(row.get::<sqlx::types::Uuid, _>(1).as_u128()),
  })
  .fetch_one(pool)
  .await
  .context("Creating user")
}
```

本来ならもっと上手いやり方がありそうな気もするのだが、今のところはこのような方法で乗り切っている。
