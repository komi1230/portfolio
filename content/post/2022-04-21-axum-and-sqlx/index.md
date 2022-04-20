---
layout: post
title: GCPでCDNをTerraformで実装する
subtitle: Cloud Storageとロードバランサーとキャッシュと
description: GCPでTerraformを使ってCDNを構築する方法についてまとめる
date: 2022-04-20
author: Yusuke Kominami
image: "https://www.shutterstock.com/blog/wp-content/uploads/sites/5/2017/04/featuredwaterfalls.jpg"
tags:
  - terraform
  - gcp
categories:
  - tech
---

# CDNの構築は意外とめんどい

CDNは画像等の静的ファイルを流すためのネットワークで、アーキテクチャとしては単純なのだが準備することが地味に多く結構めんどくさかったりする。
やるべきこととしては以下の通りなのだが、意外と大変。

- HTTPSのプロキシを作成する
- フォワーディングルールを用意してプロキシと紐付ける
- URLマッパーを実装する
- バックエンドバケットを用意する(キャッシュ用)
- (任意) CDN用のサブドメインを用意する

これらをコンソール画面でぽちぽち手でやってると確実にミスが発生するし、本番環境とは別でステージング、開発環境も同様にすると尚更厄介で、なので今回はTerraformで用意する。

# コードと説明

まずCDN用のサブドメインを用意する。

```terraform
resource "google_dns_managed_zone" "cdn" {
  name        = "cdn-managed-zone"
  dns_name    = "cdn.${var.domain}"
  description = "Managed Zone for cdn.${var.domain}"

  dnssec_config {
    state         = "on"
    non_existence = "nsec3"
  }
}

resource "google_compute_global_address" "cdn" {
  name = "cdn-ip"
}

resource "google_dns_record_set" "cdn_a" {
  name         = google_dns_managed_zone.cdn.dns_name
  type         = "A"
  ttl          = 300
  managed_zone = google_dns_managed_zone.cdn.name
  rrdatas      = [google_compute_global_address.cdn.address]
}

// 任意
resource "google_dns_record_set" "cdn_ns" {
  name         = google_dns_managed_zone.cdn.dns_name
  type         = "NS"
  ttl          = 300
  managed_zone = google_dns_managed_zone.origin.name // FIX ME
  rrdatas      = google_dns_managed_zone.cdn.name_servers
}
```

これで `cdn.example.com` 的な感じのサブドメインが作れる。
最後の部分は`example.com`を管理してるマネージドゾーンに`cdn.example.com`のサブドメインへNSレコードを貼る役割。


次に、もちろんマネージド証明書もセットアップする。

```terraform
resource "google_compute_managed_ssl_certificate" "cdn" {
  name = "cdn-certificate"

  managed {
    domains = [google_dns_managed_zone.cdn.dns_name]
  }
}
```

これにてドメイン関連は終わり。

次にフォワーディングルールとHTTPSプロキシ、URLマップを作る。


```terraform
resource "google_compute_target_https_proxy" "cdn" {
  name             = "cdn-https-proxy"
  url_map          = google_compute_url_map.cdn.self_link
  ssl_certificates = [google_compute_managed_ssl_certificate.cdn.self_link]
  ssl_policy       = google_compute_ssl_policy.ssl_policy.name
}

resource "google_compute_global_forwarding_rule" "cdn" {
  name       = "cdn-forwarding-rule"
  target     = google_compute_target_https_proxy.cdn.self_link
  port_range = "443"
  ip_address = google_compute_global_address.cdn.address
}

resource "google_compute_url_map" "cdn" {
  name            = "cdn-url-map"
  default_service = google_compute_backend_bucket.cdn.id
  project         = var.project
}

resource "google_compute_ssl_policy" "ssl_policy" {
  name            = "streets-ssl-policy"
  profile         = "MODERN"
  min_tls_version = "TLS_1_2"
}
```

セキュリティのためにSSLポリシーを作っておいた。
これでTLSのバージョンが1.1以下の通信はお断りできる。

最後にバックエンドバケットを設定する。
これは静的ファイルのキャッシュ等に使える。

```terraform
resource "google_compute_backend_bucket" "cdn" {
  name        = "cdn-backend-bucket"
  description = "Backend bucket for serving static content through CDN"
  bucket_name = google_storage_bucket.cdn.name
  enable_cdn  = true
}
```

`bucket_name`にはCDN用のCloud Storageのバケットの名前を当てる。

```terraform
resource "google_storage_bucket" "cdn" {
  name          = "foo-bar-piyo-cdn-${terraform.workspace}"
  location      = var.location
}

resource "google_storage_bucket_iam_member" "cdn" {
  bucket = google_storage_bucket.cdn.name
  role   = "roles/storage.legacyObjectReader"
  member = "allUsers"
}
```

全員がバケットの中身が見れるよう権限を`allUsers`に与えたおいた。

ここで注意なのが、Cloud Storageのバケット名は全世界のGCPプロジェクトでユニークである必要があるので`cdn-bucket`みたいなありきたりな名前はエラーになる。

# ドメインを新しく作らないパターン

上記の例では`cdn.example.com`というサブドメインでCDN用のトラフィックが流れるようにしたが、別のパターンとして`api.example.com`にアクセスポイントは集中させて`/static/`というパスの場合は静的ファイルが流れるようにしたいというケースもあるだろう。

その場合はURLマップを少しいじって以下の通りにすれば良い。

```terraform
resource "google_compute_url_map" "api" {
  name            = "my-url-map"
  default_service = google_compute_backend_service.api.id
  project         = var.project

  host_rule {
    hosts        = ["*"]
    path_matcher = "allpaths"
  }

  path_matcher {
    name            = "allpaths"
    default_service = google_compute_backend_service.api.id

    path_rule {
      paths   = ["/static", "/static/*"]
      service = google_compute_backend_bucket.cdn.id
    }
  }
}
```

アクセスは`api.example.com`のサブドメインで受け、基本的にはバックエンドサービス(Cloud RunやApp Engineなど)に流すが、パスが`/static/`の場合にのみCDNに流すという設定がこれでできる。

注意なのがパスの構成はCDNにも伝播するのでバケットの第一階層に`static`という名前のディレクトリを作り、その中に`sample.jpg`などの画像を置く必要がある。
そこでようやく`api.example.com/static/sample.jpg`というURLにアクセスしてデータを参照できる。

受けたパス階層から別のパスにリライトする設定も可能なのだが、`/static`を`/`にリライトするものはデフォルトサービスとぶつかってしまうためできない。
そのためバケットの第一階層が`static`というフォルダを置くしかないのが気持ち悪いと感じる場合は大人しくCDN用にサブドメインを切るのが懸命。


