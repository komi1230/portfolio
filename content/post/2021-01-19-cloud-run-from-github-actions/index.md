---
layout:      post
title:       "GitHub ActionsからCloud Runを叩く"
subtitle:    "各種のセットアップで陥る罠について"
description: "GitHub ActionsとCloud Runは便利だがCI/CDの設定で今回陥った罠についてツラツラと書く"
date:        2021-01-19
author:      "Yusuke Kominami"
image:       "https://cdn.whistler.com/s3/images/winter2019/whistler-village.jpg"
tags:        ["GitHub Actions", "CI", "GCP"]
categories:  ["Tech"]
---

# GitHub ActionsとCloud Run

CI/CDというと有名なのはCircle CIだろう。
他にはTravis CIやGitLab CIあたり？(Travisはなんかもうすぐ死ぬみたいなのを聞いたような気もするけど)

そんな中、GitHubが公式に提供しているCI/CDツールとしてGitHub Actionsがある。

今回行っていた作業はGitHub ActionsからCloud RunへのCD環境を整えることだったのだけど、その過程で色々落とし穴にハマった。

これらのCI/CDツールはそれぞれで文法が異なっていたりしたことや、Cloud Runのサービスアカウントのセットにミスったことなどたくさん学んだことがあったので今回はここでまとめておこうと思う。

# 設定ファイル

最終的な設定ファイルとしてはこのようになっている。

```yaml
name: Deploy to Cloud Run

on:
  push:
    branches:
      - master

env:
  ENVIRONMENT: production
  GCP_SA_KEY: ${{ secrets.GCP_SERVICE_ACCOUNT_KEY }}
  GCP_PROJECT_ID: ${{ secrets.GCP_PROJECT_ID }}
  GCP_REGION: ${{ secrets.GCP_REGION }}

jobs:
  deploy:
    name: Setup EC
    runs-on: ubuntu-latest

    steps:
    - name: Checkout
      uses: actions/checkout@v2
    
    # gcloudコマンドの設定
    - name: Install gcloud command and configure credentials
      uses: google-github-actions/setup-gcloud@v0.2.0
      with:
        service_account_key: ${{ env.GCP_SA_KEY }}
        project_id: ${{ env.GCP_PROJECT_ID }}
    
    # DockerにgcloudコマンドのCredentialを使わせる
    - name: Auth Docker with gcloud credentials
      run: |
        gcloud --quiet auth configure-docker

    # Dockerイメージを作成 (今回はとりあえずEcho Serverで)
    - name: Build Docker image
      run: |
        docker pull ealen/echo-server
    
    # DockerイメージをContainer RegistryにPush
    - name: Publish image
      run: |
        export IMAGE_NAME=${ENVIRONMENT}_server
        export DOCKER_TAG=asia.gcr.io/${GCP_PROJECT_ID}/${IMAGE_NAME}:${GITHUB_SHA::8}
        docker tag ealen/echo-server $DOCKER_TAG
        docker push $DOCKER_TAG
    
    - name: Deploy
      run: |
        gcloud run deploy sample-server \
          --image $DOCKER_TAG \
          --project $GCP_PROJECT_ID \
          --region $GCP_REGION \
          --platform managed \
          --quiet
```

割と簡単な感じなのだけど地味にハマったポイントがいくつかあったのでまとめておく。

## DockerにCloud SDKのCredentialを使わせる

当初はGitHub Actionsでgcloudコマンドを使えれば良いと思っていて、[google-github-actions/setup-gcloud](https://github.com/google-github-actions/setup-gcloud)のREADMEに書いてある通りのことだけを設定ファイルに記述していた。

しかし、今回はCloud Runにデプロイする関係で一度コンテナをContainer Registryへとあげておかなければならない。

そのために`docker push`コマンドを叩くわけだけども、このコマンドを叩くにはdocker自体がCloud SDKのCredentialを把握しておく必要がある。

これは

```
$ gcloud --quiet auth configure-docker
```

で実現される。

## 環境変数とGitHub Actionsの変数で文法が違う

GitHub Actionsでは環境変数とワークフロー内での変数はレイヤーが異なる。

ワークフロー内の`env`オブジェクトに環境変数が入り込むのである。

ワークフロー変数(`GITHUB_SHA`や`env.GCP_PROJECT_ID`など)を使うには`${{ some_value }}`として使い、環境変数を使うには`${some_value}`か`${{ env.some_value }}`とすれば良い。

これの何にハマったかというと、環境変数については`${some_value}`はオッケーだが`${ some_value }`はダメなのである。

空白を入れてはいけないというルール。

同様に、ワークフロー変数については`${{ GITHUB_SHA }}`はオッケーだが`${{GITHUB_SHA}}`はダメである。

これに気づかずCIを30回以上コケさせた。

# GCPでの設定

GCPではやるべきことは

- GitHub Actionsで動かす用にサービスアカウントを作成
- Cloud RunとContainer Registryで使えるロールを付与

の2点だけ。

ロールの付与については

- Service Account User
- Cloud Run Admin
- Storage Admin

の3つ。

これも結構簡単なのだが結構ハマった。

## Container Registryという名のCloud Storage

Container Registryはコンテナのデータベースという感じでDocker Hubみたいなものだが、中身はCloud Storageである。

そのためサービスアカウントにはCloud Storageの権限を与えれば良いが、Cloud Storageの権限は

- ストレージの中身の操作に関するもの(閲覧、作成と消去)
- 別のサービスへストレージの中身を転送するもの

の2つがある。

セキュリティの観点から最小限の権利だけを与えようと思って1つ目のもののAdminだけを設定したのだが、ずっとPermission Deniedになってしまっていた。

```
denied: Token exchange failed for project '[project-id]'. Caller does not have permission 'storage.buckets.create'. To configure permissions, follow instructions at: https://cloud.google.com/container-registry/docs/access-control
```

色々試してみた結果、Storage全体のAdmin権限を渡したら動くようになった。

# まとめ

GitHub ActionsとCloud Runはめちゃくちゃ便利だけど少し慣れていないと罠にハマるので気をつけたい。