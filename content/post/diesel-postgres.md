+++
title="DieselでPostgreSQLに接続"
date=2020-07-24
+++

最近はずっとRustで簡単なWebアプリを作っているのだけど、PostgreSQLへの接続にちょっと困ったのでメモ。

### 環境

+ Rust: 1.45.0

```
[dependencies]
actix-web = "2.0.0"
actix-rt = "1.1.1"
diesel = { version = "1.4.5", features = ["postgres", "chrono", "r2d2"] }
dotenv = "0.15.0"
serde = "1.0.114"
chrono = { version = "0.4.13", features = ["serde"] }
r2d2 = "0.8.9"
```

### やったこと

まず最初にDiesel CLIを入れる。

```bash
cargo install diesel_cli
```

その後、作業ディレクトリの中で`.env`というファイルを作り、その中に

```
DATABASE_URL=postgres://[username]:[password]@localhost/[some_name]
```

と書き込む。

このとき`username`と`password`はローカル環境なら端末のユーザー名とパスワード。

次にPostgreSQLサーバーを立てる。

PostgreSQLのインストールで、Macの場合は

```
brew install postgresql
```

とする。

これを入れることで

```bash
# PostgreSQLサーバー起動
postgres -D /usr/local/var/postgres

# PostgreSQLサーバーへ接続するためのクライアント
psql -h [ホスト名] -U [ユーザー名] -p [パスワード] [テーブル名]

# テーブル作成
createdb -h [ホスト名] -U [ユーザー名] -p [パスワード] [テーブル名]
```

などのコマンドが打てる。

ローカル環境の場合はpsqlコマンドの`-h`や`-U`などのオプションはデフォルトでlocalhostに繋がるようになっており、手元で簡単に試すのであれば`psql [テーブル名]`などすれば良い。

さて、今回はDieselでPostgreSQLにつなぐことが目的なので、サーバーを立てる。

```bash
postgres -D /usr/local/var/postgres
```

これを裏でやっておいて、作業ディレクトリでDieselのセットアップをする。

```bash
diesel setup
```

こうすると先ほど後ろで走らせておいたPostgreSQLサーバーに通信が飛んだのがわかると思う。

あとは[Dieselのチュートリアル](https://diesel.rs/guides/getting-started/)の通りにやればよく、まずSQLのコマンドを生成する。

```bash
diesel migration generate create_posts
```

これをやると作業ディレクトリにmigrationというディレクトリが作られ、中に`up.sql`と`down.sql`というファイルが作られる。

それぞれ

```sql
CREATE TABLE posts (
  id SERIAL PRIMARY KEY,
  title VARCHAR NOT NULL,
  body TEXT NOT NULL,
  published BOOLEAN NOT NULL DEFAULT 'f'
)
```

```sql
DROP TABLE posts
```

と書き込む。

あとは

```bash
diesel migration run
```

とコマンドを打てば、裏側で走らせてるPostgreSQLサーバーが走ってCREATE TABLEしてくれる。

### 反省

最初に作業をしていたとき、ローカルでPostgreSQLサーバーを立てるのがめんどくさくて、`.env`の中を

```
DATABASE_URL="test.db"
```

としており、実際に`diesel setup`などをすると若干怪しい動きをしつつも作業ディレクトリに`test.db`というファイルが生成されていたのでイケると勝手に勘違いしていた。

その後、作業を続けてActix-webでHTTPサーバー立てようとしたときデータベースへの繋ぎ込みがうまくいかないことが原因となってHTTPサーバー自体も立ち上がらず...

そんなこんなでかなり時間を食ってしまった(CircleCIもめちゃくちゃコケた)ので、これからはローカル開発でもサボらずにサーバーを立てようと思う。
