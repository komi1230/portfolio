---
layout: post
title: RustアプリをCloud RunとCloud SQLで動かす
subtitle: プライベート環境での設定について
description: Cloud SQLをVPC内でホスティングしてCloud Runから接続する際、rustlsではなくnative-tlsを使う必要がある
date: 2022-05-04
author: Yusuke Kominami
image: "https://media-exp1.licdn.com/dms/image/C4D1BAQH6jj4Fjem2CA/company-background_10000/0/1648494843074?e=2147483647&v=beta&t=IE4EPeyxEufvjiHsUkRZXWycuI5H1q_HoWoAH0CjiF8"
tags:
  - rust
  - gcp
categories:
  - tech
---

# Cloud Runからプライベート環境のCloud SQLに繋ぐ

Cloud SQLインスタンスを立てる際、パブリックIPを付与するかVPC内に立ててプライベートIPを付与するか、またはその両方を設定することができる。

パブリックIPの場合は簡単にホスト名にIPを当てればいいのだが、プライベートIPの場合はVPC内に通信できるようVPCコネクタを用意する必要がある。

Cloud RunはVPC内に立てるということができないので、このVPCコネクタを使うのが有効となる。

```terraform  
resource "google_compute_network" "vpc" {
  name                    = "vpc"
  auto_create_subnetworks = false
}

resource "google_compute_subnetwork" "vpc" {
  name                     = "vpc"
  ip_cidr_range            = "10.0.0.0/16"
  network                  = google_compute_network.vpc.self_link
  region                   = var.region
  private_ip_google_access = true
}

resource "google_vpc_access_connector" "connector" {
  provider = google-beta

  name   = "vpc-connector"
  region = var.region
  ip_cidr_range = "10.8.0.0/28"
  network       = google_compute_network.vpc.name
}

resource "google_compute_router" "router" {
  provider = google-beta

  name    = "vpc-router"
  region  = var.region
  network = google_compute_network.vpc.id
}

resource "google_compute_router_nat" "router_nat" {
  provider = google-beta

  name                               = "vpc-nat"
  region                             = var.region
  router                             = google_compute_router.router.name
  source_subnetwork_ip_ranges_to_nat = "ALL_SUBNETWORKS_ALL_IP_RANGES"
  nat_ip_allocate_option             = "AUTO_ONLY"
}
```

VPCコネクタは上記のような具合で作れる。

CIDRの指定について、VPCコネクタが使用する内部IPは他のVPC内のリソースと被ってはいけないため、例えばCloud SQLの内部IPが`10.60.0.0`のときにVPCコネクタのCIDRに`10.60.0.0/28`などとするのは無理となる。

VPCコネクションにあたって該当IPをサービスと連携させておく必要があるため、以下のようにIPを固定した上でそれを`servicenetworking.googleapis.com`と紐付ける。

```terraform
resource "google_compute_global_address" "private_ip_address" {
  provider = google-beta

  name          = "vpc-private-ip-address"
  purpose       = "VPC_PEERING"
  address_type  = "INTERNAL"
  prefix_length = 16
  network       = google_compute_network.vpc.id
}

resource "google_service_networking_connection" "private_vpc_connection" {
  provider = google-beta

  network                 = google_compute_network.vpc.id
  service                 = "servicenetworking.googleapis.com"
  reserved_peering_ranges = [google_compute_global_address.private_ip_address.name]
}
```

あとはCloud SQLを立てる際にこのVPCを指定する。

```terraform

resource "google_sql_database_instance" "app" {
  name             = "app-db"
  database_version = "POSTGRES_14"
  region           = var.region

  settings {
    tier              = "db-f1-micro"
    disk_autoresize   = true
    availability_type = "REGIONAL"

    backup_configuration {
      enabled                        = true
      point_in_time_recovery_enabled = true
    }

    ip_configuration {
      ipv4_enabled    = false
      private_network = var.vpc_id // Specify VPC name

    }
  }

  deletion_protection = false
}
```

そして同様にCloud Runでマニフェスト内の`.metadata.annotations`内に`"run.googleapis.com/vpc-access-connector`に値をセットしてVPCコネクタを使用するよう設定する。

```terraform
resource "google_cloud_run_service" "api" {
  name     = "my-service"
  location = var.location

  template {
    spec {
      service_account_name = var.service_account_name
      containers {
        image = var.image
        ports {
          container_port = 3000
        }
        env {
          name  = "DATABASE_USER"
          value = var.database_user
        }
        env {
          name = "DATABASE_PASS"
          value_from {
            secret_key_ref {
              key  = "latest"
              name = google_secret_manager_secret.db_password.secret_id
            }
          }
        }
        env {
          name  = "DATABASE_NAME"
          value = var.database_name
        }
        env {
          name  = "DATABASE_HOSTS"
          value = "${var.db_ip_primary},${var.db_ip_read}"
        }
        env {
          name  = "DATABASE_PORT"
          value = var.database_port
        }
      }
    }

    metadata {
      annotations = {
        # Use the VPC Connector
        "run.googleapis.com/vpc-access-connector" = var.vpc_connector_name // Specify VPC connector
        # all egress from the service should go through the VPC Connector
        "run.googleapis.com/vpc-access-egress" = "all"
        # If this resource is created by gcloud, this client-name will be gcloud
        "run.googleapis.com/client-name" = "terraform"
        # Disallow direct access from IP
        "run.googleapis.com/ingress" = "internal-and-cloud-load-balancing"
      }
    }
  }

  traffic {
    percent         = 100
    latest_revision = true
  }

  lifecycle {
    ignore_changes = [
      # For update of gcloud cli version
      template[0].metadata[0].annotations["run.googleapis.com/client-version"]
    ]
  }

  autogenerate_revision_name = true
}
```

これでCloud SQLに繋ぐ際はホスト名に内部IPを指定してあげれば通信が成立する。

このホスト名の指定で[GCPの公式ドキュメント](https://cloud.google.com/sql/docs/postgres/connect-run?hl=ja#python_1)が本当に分かりにくくて苦労した。

というのもサンプルコードにてホスト名の例が`127.0.0.1`としてあり、本来`127.0.0.1`はループバックアドレスで内部IPの定義外なのだが、本来`10.60.0.0`のような内部IPを指定すれば良いのにも関わらずここで例として内部IP以外の値が出てきているせいで結局ホスト名に何を指定すれば良いのか全くわからなかったのである。

実際、現在組んでいるアプリケーションではAPIによってプライマリDBかリードレプリカかを使い分けており、`127.0.0.1`宛ての通信だとポート番号で通信先を変える必要があるのだが、Cloud Runではサイドカーパターンはサポートしていない(コンテナは1つしか指定できない)ためCloud SQL Auth Proxyが使えない。

結局Cloud SQLに繋ぎこむだけの作業で3日ほど潰したのは結構痛かった。

# ホスト名が内部IPとなる際はrustlsではなくnative-tlsを使う必要がある

上記の通り適切にホスト名を指定すれば通信はできるのだが、今回の落とし穴としてTLSクレートとしてrustlsを使っていたというのもあった。

[こちらのブログ](https://crudzoo.com/blog/rust-run)に助けてもらい、native-tlsに差し替えることでサクッと疎通が確認できた。


