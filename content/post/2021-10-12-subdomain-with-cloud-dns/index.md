---
layout:      post
title:       "Cloud DNSでのサブサブドメインの設定"
subtitle:    "Terraformを用いた実装"
description: "Cloud DNSでサブドメインを設定する際のマネージドゾーンなどについて"
date:        2021-10-12
author:      "Yusuke Kominami"
image:       "https://www.jrtours.co.jp/plan/kyoto/nav/images/03/mv.jpg"
tags:        ["DNS", "Terraform", "GCP"]
categories:  ["Tech"]
---

# Cloud DNSとGoogle Domains、Cloud Domains
Googleが提供しているDNS系のサービスとしてCloud DNSとGoogle Domains、Cloud Domainsの3つがある。
これらの違いは何かというと、

||機能|
|:--:|:--:|
|Cloud DNS|ゾーンとレコードの設定|
|Google Domains|ドメインの取得、ネームサーバーの設定|
|Cloud Domains|ドメインの取得、ネームサーバーの設定|

となっている。
Google DomainsとCloud Domainsの機能はほぼ完全に被っているが、これはCloud Domainsが割と最近のサービスでGCPのコンソールからGoogle Domainsと同様のことができるようになったというのが理由となっている。
参考としては[Cloud Domains のご紹介: カスタム ドメインの登録と管理を簡素化](https://cloud.google.com/blog/ja/products/networking/introducing-cloud-domains)がちょうど良さそう。
なお、Cloud Domainsはこのドキュメントに書いてある通り、背後ではGoogle Domainsを登録事業者としているため、インターフェースの違いはあれど実質的に同じものと見て良い気がする。

# やってみる

今回の流れとして、何かしら自分のWebサイトにてドメインを当てたいケースを考える。
手元には複数サービスを立てたいため、`example.com`以外に`foo.example.com`というようなサブドメインを作って各サービスを立てるものとする。
また、staging環境とproduction環境は分けたいため、staging環境では`hoge.staging.example.com`というようなサブサブドメインで吸収する。

以下、これをTerraformで実装していく。

## Google Domainsにてドメインを取得する

これはサイトの通りに従って購入する。

## Cloud DNSでゾーンを構成する

最初はProduction環境について。

まず大元となるマネージドゾーンを構成する。

```terraform
resource "google_dns_managed_zone" "production" {
  name        = "production"
  dns_name    = "example.com."
  description = "some description"
}

output "managed_zone" {
  description = <<DESC
  some description
  >>
  value = google_dns_managed_zone.production.name_servers
}
```

フィールドの`dns_name`では最後にピリオド`.`が必要だが、これは**これがドメインの末尾です**というのを示すために最後にピリオドをつける必要があり、注意。

ゾーンが構成されたら、立てたいサービスの分のグローバルIPを確保し、そのIPを用いてAレコードを構成する。

```terraform
// example.comに立てるサービス
resource "google_compute_global_address" "service1_production" {
  name = "service1-production"
}

resource "google_dns_record_set" "service1" {
  name = google_dns_managed_zone.production.dns_name
  type = "A"
  ttl  = 300

  managed_zone = google_dns_managed_zone.production.name

  rrdatas = [google_compute_global_address.service1_production.address]
}

// service2.example.comに立てるサービス
resource "google_compute_global_address" "service2_production" {
  name = "service2-production"
}

resource "google_dns_record_set" "service1" {
  name = "service2.${google_dns_managed_zone.production.dns_name}"
  type = "A"
  ttl  = 300

  managed_zone = google_dns_managed_zone.production.name

  rrdatas = [google_compute_global_address.service2_production.address]
}
```

さて、Production環境についてはこれで`example.com`にservice1が、`service2.example.com`にservice2が立つようになった。

次にStaging環境でこれを構成する。

基本的には上記の通りIPを確保してAレコードを当てれば良いのだが、キーポイントとして`service2.staging.example.com`というようなサブドメインを駆使して環境差分(production/staging)を吸収するケースでは`staging.example.com`といった各環境ごとにゾーンを構成する方が構成として綺麗である。

各環境ごとにゾーンを構成するためにはメインのゾーンから各環境を示すサブドメインに対してNSレコードを貼っておく必要がある。

```terraform
// NS record for staging
resource "google_dns_record_set" "staging" {
  name = "staging.${google_dns_managed_zone.production.dns_name}"
  type = "NS"
  ttl  = 300

  managed_zone = google_dns_managed_zone.production.name

  rrdatas = google_dns_managed_zone.production.name_servers
}
```

この上で、ゾーンを構成し、各サービスについてのIPとレコードを構成する。

```terraform
// Staging Zone
resource "google_dns_managed_zone" "staging" {
  name        = "staging"
  dns_name    = "example.com."
  description = "some description"
}

// staging.example.comに立てるサービス
resource "google_compute_global_address" "service1_staging" {
  name = "service1-staging"
}

resource "google_dns_record_set" "service1" {
  name = google_dns_managed_zone.staging.dns_name
  type = "A"
  ttl  = 300

  managed_zone = google_dns_managed_zone.staging.name

  rrdatas = [google_compute_global_address.service1.address]
}

// service2.staging.example.comに立てるサービス
resource "google_compute_global_address" "service2_staging" {
  name = "service2-staging"
}

resource "google_dns_record_set" "service1" {
  name = "service2.${google_dns_managed_zone.staging.dns_name}"
  type = "A"
  ttl  = 300

  managed_zone = google_dns_managed_zone.staging.name

  rrdatas = [google_compute_global_address.service2.address]
}
```

## Google Domainsにてネームサーバーを設定する

ここまでできたらGoogle Domainsのカスタムネームサーバーにてゾーン構成時のネームサーバーを設定する。
ネームサーバーは`google_dns_managed_zone`リソースを実行した際にネームサーバーが自動的に設定される。

# まとめ

自分がこの作業をした際、`staging.example.com`のNSレコードを構成していなかったためstaging環境についてはドメインが無効で、これで数日溶かした。

ひとまずこれにて各環境差分を吸収しつつ複数サービスのドメインを設定できた。