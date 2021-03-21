---
layout:      post
title:       "GKEにおけるDigdagでのGCPのクレデンシャルの取り扱い"
subtitle:    "bqオペレータとgcloudコマンドのクレデンシャルのズレ"
description: "DigdagとEmbulkでBigQueryにデータを流す際にクレデンシャルのスイッチでハマったポイント"
date:        2021-03-21
author:      "Yusuke Kominami"
image:       "https://churchwithoutwallsinternational.org/wp-content/uploads/2018/03/sydney-opera-house-australia-UNITEDSYDNEY1217.jpg"
tags:        ["digdag", "gcp"]
categories:  ["Tech"]
---

# DigdagとGCP

Digdagはワークフローエンジンとして有名なソフトで、複数個のタスク間の依存関係からなるワークフローを定義し、そのワークフローの実行及び管理を行う。

具体的に、複数テーブルのインポートを行いたいとなったとき、それらに対して逐次的にEmbulkを手で叩くのではなく、DigdagがうまいことEmbulkを叩いてくれる。

```
+some_job:
  sh>: embulk run some_table.yaml.liquid
```

そんなDigdagであるが、バッチ処理に非常によく使われるため、GCPやAWSに対応したコマンドがDigdag側に用意されている。
これは本来ならば上記のように`sh>`オペレータでシェルでコマンドを叩くが、BigQuery関係だと`bq>`とか`bq_ddl>`といったコマンドが用意されている。

```
+some_bq_job:
  bq>: queries/step.sql
  destination_table: other_project:other_dataset.other_table
```

これは実質的に`sh>: bq ...`コマンドの糖衣構文だけど、これは比較的便利なのでよく利用される。

# GKEでのクレデンシャルのセット

Digdagの公式ドキュメントには`bq>`オペレータを利用する際はDigdagのSecretsにサービスアカウントキーをセットするよう書いてある。

Digdagが動いているコンテナ内で以下のコマンドを叩けば良い。

```sh
$ digdag secret --project [YOUR_PROJECT_NAME] --set gcp.credential=@/path/to/sa_key.json
```

こうすると`bq>`オペレータを叩く際にこのサービスアカウントとして実行される。

しかし、ここでポイントとして、このクレデンシャルはコンテナ全体でサービスアカウントが有効化されているわけではない。

GKEでポッドの中に入ってクレデンシャルを叩くと、GKEを動作しているサービスアカウントが出てくる。

```sh
$ gcloud config list
```

# サービスアカウントの有効化

`bq>`オペレータや`bq_ddl>`オペレータでは微妙にやりきれない作業などはたまにあり、その際は直接シェルで`bq`を叩きたいケースがある。

例えばテーブルのスキーマに説明を付与したくて、そのスキーマ情報はJSONで保存されているときなど。

こうした際はSQLに`CREATE TABLE`文でやる方法もあるが、それよりも`bq update`でテーブル情報をアップデートする方が簡単だったりする。

この場合、意図的にDigdag内でサービスアカウントを有効化させるジョブを挟み込む必要があり、

```
+auth_sa:
  sh>: gcloud auth activate-service-account --key-file=/path/to/sa_key.json

+some_job:
  sh>: bq update my_dataset.my_table schema/my_table.json
```

というようにすればサービスアカウントで実行ができる。