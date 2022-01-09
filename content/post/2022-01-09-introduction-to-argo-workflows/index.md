---
layout:      post
title:       "Argo Workflowsの設定や文法"
subtitle:    "KubernetesネイティブなワークフローエンジンであるArgo Workflowsについて諸々"
description: "データエンジニアリングの技術が成熟してきた中でまだポピュラーではないArgo Workflowsについてのちょっとした解説"
date:        2022-01-09
author:      "Yusuke Kominami"
image:       "https://static.retrip.jp/article/18154/images/18154adc810e3-9903-4209-a64f-50ef2fc12ceb_l.jpg"
tags:        ["Kubernetes", "Argo Workflows"]
categories:  ["Tech"]
---

# はじめに

最近はデータに基づいた意思決定が云々ということで多くの組織でデータ基盤を整備する流れがある。

データ基盤の主要となるコンポーネントは何かというと、

|コンポーネント|役割|例|
|:--:|:--:|:--:|
|BIツール|データの可視化、ダッシュボードの構築|ReDash、Looker、Metabase|
|データウェアハウス|整備済みのデータを蓄積する場所|BigQuery, Redshift|
|データパイプライン|アプリケーションDBからデータウェアハウスへデータを加工・転送するための基盤|Airflow, Luigi, Kubeflow, Argo Workflows、Digdag|

というような感じになっていて、目的や供与可能なコスト分を考えながらここらへんをうまいこと組み合わせてデータ基盤というのは構築される。

最近では多くの企業でデータエンジニアというポジションが募集されており、データエンジニアは何をしているかというとここらへんの構築・整備を行う。

正直なところデータエンジニアの仕事というのはエンジニアリング的に難しいことは何もなくて、基本的に社内政治に振り回されながら泥臭い作業を行うだけの妖怪になるという悲しい役割に終始するのだけれど、ひとまず業務としてはワークフローエンジンの整備を行う。

ワークフローエンジンに何を使うかについては結構トレンドがあり、少し前(だいたい5年前とか？)はDigdagを使うのが主流だったのだけれど最近はユーザーも離れてしまいあまり開発も活発ではなくなってしまっており(DigdagはJavaで作られているのだが最近のLog4jの問題が発覚した際も関連Issueが全く立っていない)、今の流行りはAirflowあたりな気がしている。

ただ、最近AirflowからArgo Workflowsへ乗り換えようと検討するケースがたくさんあり、今後はArgo Workflowsがブームになりそうであるため、今回の記事ではArgo Workflowsについての基礎的な文法や色々についてまとめておこうと思う。

# Argo Workflowsについて

Argo Workflowsは要するにただのワークフローエンジンなのだけれど、なぜAirflowなどと比較して良いとされているかというと以下のようなポイントがある。

- Kubernetesネイティブな設計となっており、ジョブごとにPodに切り分けて実行してくれるためコンピューティングリソースを有効活用できる
- ワークフロー定義などはKubernetesのマニフェストとなっていて、ワークフローの定義と各タスクにおけるロジックの関心が分離できる
- Airflowと同様のことができ、よりジェネラルなワークフローエンジンとなっている

AirflowやLuigiはPythonによってワークフローを記述していくが、Argo Workflowsはワークフロー自体はyamlで記述して各タスクについてはDockerイメージを実行するという機構になっているので、かなりジェネリックにタスクを投げることができる。

データエンジニアリングは基本的に付加的に要件が増えて様々なケースに対応する必要があり、差分デプロイが用意な機構となっているArgo Workflowsはデータエンジニアリングと非常に相性がいいのである。

こうした点から最近はArgo Workflowsが使われるケースが増えている。

ということでArgo Workflowsについて簡単な解説をしようと思うのだけれど、日本ではArgo Workflowsを使っているケースがまだまだ少なく日本語の解説記事も少ないのでちょっとしたまとめを書いておこうと思う。

## 環境構築

Argo Workflowsを使うにあたってまず準備する必要がある。

本家のドキュメントを見てみるとQuick Startはあるようだけど、実際にプロダクション環境で使うにはどのようなマニフェストになるかについては詳しく書いてない(なんでやねん)

ということで基本的にQuick Startのやつを分解してプロダクション向けにカスタマイズしまくるのだけど、詳しいセットアップについては以下の記事を書いたので参照していただきたい。

[Argo Workflowsをセットアップする](https://tech.hey.jp/entry/2021/11/16/182516)

(会社のブログじゃなくてこっちのブログで書けばよかったな...)

## Argo Workflowsのコンポーネント

Argo Workflowsでは以下の概念がある。

|概念|解説|
|:--:|:--:|
|Workflow|実行されるワークフローのこと|
|WorkflowTemplate|再利用性のあるワークフローで、ライブラリのように使える。他のWorkflowTemplateを参照でき、これをSubmitすることでWorkflowが実行される。|
|CronWorkflow|Cronジョブで、WorkflowTemplateを指定する|

例えばWorkflowの定義は以下のようになる。

```yaml
apiVersion: argoproj.io/v1alpha1
kind: Workflow
metadata:
  generateName: hello-
  namespace: argo
spec:
  entrypoint: example
  serviceAccountName: argo-sa
  templates:
    - name: example
      steps:
      - - name: print-message
          template: whalesay
          arguments:
            parameters:
            - name: message
              value: "{{item}}"
          withItems:
          - hello world
          - goodbye world

    - name: whalesay
      inputs:
        parameters:
        - name: message
      container:
        image: docker/whalesay:latest
        command: [cowsay]
        args: ["{{inputs.parameters.message}}"]
```

上記のマニフェストでは`templates`フィールドでWorkflowTemplateのリストが格納されており、それぞれにどのようなタスクをこなさせるかが記述される。

見ての通り`template: whalesay`として他のWorkflowTemplateを呼び出しており、感覚として関数定義とその呼び出しに近い。

一部で`"{{...}}"`という記述があるが、これはGoテンプレートの特徴で(ArgoはGoで開発されている)、ここにメタ的に変数を格納することができる。

注意点として`serviceAccountName`というフィールドがあり、ここでどのKubernetesサービスアカウントを使うかを指定する必要がある(これを指定していないとデフォルトのサービスアカウントが使用され権限エラーでPodを作成することができなかったりする)

## for文

loop系の処理をどのようにさせるかというと2通りのやり方があり、`withItems`と`withSequence`、`withParam`がある。

`withItems`については上記の例の通りで`Array<String>`の値として入れることによってその中身でループさせることができる。

なお、ループで入る一時変数は`"{{item}}"`で受け取れる。

`withSequence`についてはPythonでいる`for i in range(10, 20)`のようなノリで、

```yaml
- name: sequence-start-end
  template: echo
  withSequence:
    start: "100"
    end: "105"
```

というように使える。

また、`withSequence`の中身は

```yaml
- name: sequence-start-end
  template: echo
  withSequence:
    count: "5"
```

というように`count`を使っても良い。

どのような範囲でループさせるかを動的に決定したい場合は`withParam`を使えば良く、

```yaml
spec:
  entrypoint: loop-param-result-example
  templates:
  - name: loop-param-result-example
    steps:
    - - name: generate
        template: gen-number-list
    - - name: sleep
        template: sleep-n-sec
        arguments:
          parameters:
          - name: seconds
            value: "{{item}}"
        withParam: "{{steps.generate.outputs.result}}"

  - name: gen-number-list
    script:
      image: python:alpine3.6
      command: [python]
      source: |
        import json
        import sys
        json.dump([i for i in range(20, 31)], sys.stdout)
  - name: sleep-n-sec
    inputs:
      parameters:
      - name: seconds
    container:
      image: alpine:latest
      command: [sh, -c]
      args: ["echo sleeping for {{inputs.parameters.seconds}} seconds; sleep {{inputs.parameters.seconds}}; echo done"]
```

というように最初のstepでパラメータを生成させて、それを利用させることができる。

注意点としてパラメータのリストはJSONの形をしている必要がある。

この例では`script`フィールドによってパラメータのリストを生成しているが、以下のようにコンテナ内のファイルについてループを回したいケースでは`bash`でファイルのリストを生成して...というやり方もできる。

```yaml
spec:
  serviceAccountName: argo-sa
  entrypoint: sample-workflow
  templates:
    - name: sample-workflow
      steps:
        # List tables
        - - name: tables
            template: list-tables
        - - name: transform
            template: transform-per-table
            arguments:
              parameters:
                - name: message
                  value: "{{item}}"
            withParam: "{{steps.tables.outputs.result}}"
    - name: list-messages
      container:
        image: image-name1
        command: ["/bin/bash", "-c"]
        args:
        - |
          find ./sql -type f -name "*.sql" \
            | xargs -IFILENAME basename FILENAME .sql \
            | jq -R \
            | jq --slurp .
    - name: transform-per-table
      inputs:
        parameters:
          - name: table
      container:
        image: image-name2
        command: ["./main.sh"]
        args: ["{{inputs.parameters.table}}"]
```

## 引数にenumを使う

引数にはenumを指定することができ、

```yaml
spec:
  serviceAccountName: argo-sa
  entrypoint: sample-workflow
  templates:
    - name: transform-per-table
      inputs:
        parameters:
          - name: db
            enum:
              - secure
              - normal
            description: "Select Database type"
      container:
        image: image-name2
        command: ["./main.sh"]
        args: ["{{inputs.parameters.db}}"]
```

として引数のパターンを制限することでエラーケースを狭めることでテストを容易できる。

## if文

for文を実行できるので当然if文も使える。

```yaml
spec:
  serviceAccountName: argo-sa
  entrypoint: sample-workflow
  templates:
    - name: sample-workflow
      steps:
        # List tables
        - - name: tables
            template: list-tables
        - - name: transform
            template: transform-per-table
            arguments:
              parameters:
                - name: message
                  value: "{{item}}"
            when: "{{inputs.parameters.tables}} =~ '^test_'"
```

比較の部分については`==`といった等号判定や上記の例のように`=~`で正規表現を用いたパターンマッチもできる。

## 環境変数

Argo Workflowsは本質的にKubernetesなので当然コンテナに環境変数を注入することもできる。

```yaml
spec:
  serviceAccountName: argo-sa
  entrypoint: sample-workflow
  templates:
    - name: load-per-table
      inputs:
        parameters:
          - name: db
            enum:
              - secure
              - normal
            description: "Select Database type"
      container:
        image: image-name
        command: ["./main.sh"]
        args: ["{{inputs.parameters.db}}"]
        env:
          - name: ENVIRONMENT
            valueFrom:
              configMapKeyRef:
                name: env-var-config
                key: environment
          - name: AWS_ACCESS_KEY_ID
            valueFrom:
              secretKeyRef:
                name: credentials
                key: aws-access-key-id
          - name: AWS_SECRET_ACCESS_KEY
            valueFrom:
              secretKeyRef:
                name: credentials
                key: aws-secret-access-key
          - name: AWS_DEFAULT_REGION
            value: ap-northeast-1
```

中身としては`value`で直接書き込むこともできるし、`valueFrom.configMapKeyRef`でConfigMapから読み取ったり`valueFrom.secretKeyRef`でSecretから読み取ることもできる。

これで環境変数をコンテナ内に注入することができるが、もし`args:`フィールド等でマニフェストとして利用する際は

```yaml
container:
  image: image-name
  command: ["./main.sh"]
  args: ["$(ENVIRONMENT)"]
  env:
    - name: ENVIRONMENT
      valueFrom:
        configMapKeyRef:
          name: env-var-config
          key: environment
```

のように`$(...)`として丸括弧で括る必要があるので注意。

## Slack通知

ワークフローが落ちたときはSlack通知して欲しかったりする。

そういうときは`workflow-controller-configmap`に以下のデフォルトのワークフローの設定を追加すれば良い。

```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: workflow-controller-configmap
data:
  workflowDefaults: |
    spec:
      onExit: exit-handler
      serviceAccountName: argo-sa
      templates:
        - name: exit-handler
          container:
            image: asia.gcr.io/my-repo/failure-alert:latest
            command: [ "bash", "main.sh" ]
            env:
              - name: ENVIRONMENT
                valueFrom:
                  configMapKeyRef:
                    name: env-var-config
                    key: environment
              - name: HOST
                valueFrom:
                  configMapKeyRef:
                    name: env-var-config
                    key: host
              - name: WEBHOOK_URL
                valueFrom:
                  secretKeyRef:
                    name: credentials
                    key: slack-webhook-url
              - name: WORKFLOW_STATUS
                value: "{{workflow.status}}"
              - name: WORKFLOW_NAME
                value: "{{workflow.name}}"
```

この設定をすれば全ワークフローにこのテンプレートが追加され、`onExit`の条件からワークフローが終了した際はここで定義されたワークフローが実行される。

実行されるスクリプトについては以下のようにSlack Webhook URLにcurlさせれば良い。

```bash
#!/bin/bash

set -eu

if [ "$ENVIRONMENT" = "dev" ]; then
  color="good"
elif [ "$ENVIRONMENT" = "stg" ]; then
  color="warning"
elif [ "$ENVIRONMENT" = "prd" ]; then
  color="danger"
else
  echo "Invalid value: ENVIRONMENT"
  exit 1
fi

if [ "$WORKFLOW_STATUS" = "Succeeded" ]; then
  echo "Succeeded."
  exit 0
fi

curl \
  -X POST \
  -H "Content-type: application/json" \
  --data \
  '{
    "attachments": [
      {
        "title":"Workflow status: '$WORKFLOW_STATUS'",
        "color": "'$color'",
        "fields": [
          {
            "title": "Environment",
            "value": "'$ENVIRONMENT'",
            "short": false
          },
          {
            "title": "Workflow Name",
            "value": "'$WORKFLOW_NAME'",
            "short": true
          },
          {
            "title": "URL",
            "value": "https://'$HOST'/archived-workflows/argo/?phase=Failed",
            "short": false
          }
        ]
      }
    ]
  }' \
  "$WEBHOOK_URL"
```

# GKEでArgo Workflowsを利用する際の注意

Argo WorkflowsをGKEで利用する際、Workload Identityでサービスアカウント認証をしているケースで注意しておくことがある。

それは、GKEメタデータサーバーが新しく作成されたPodでリクエストの受信を開始できるようになるまでに数秒かかるため、そこでPodが作成されてからすぐだとGCP APIを使えない可能性がある。

GKEでのWorkload Identityではサービスアカウントの認証は内部的に以下のようなエンドポイントに対してアクセストークンを払い出している。

```bash
curl -s \
  -H 'Metadata-Flavor: Google' \
  'http://metadata.google.internal/computeMetadata/v1/instance/service-accounts/default/token'
```

Podが作成された直後はメタデータサーバーがそのPodを認識できないため、`gcloud`コマンドを叩いても認証エラーになるケースがあり、以下のように`initContainers`フィールドによってメタデータサーバーとの疎通を確認してからジョブを実行させると安定する。

```yaml
apiVersion: argoproj.io/v1alpha1
kind: WorkflowTemplate
metadata:
  name: foo-workflow-template
  namespace: argo
spec:
  serviceAccountName: argo-sa
  entrypoint: foo-workflow
  templates:
    - name: hoge-workflow-load-per-table
      initContainers:
        - image:  gcr.io/google.com/cloudsdktool/cloud-sdk:326.0.0-alpine
          name: workload-identity-initcontainer
          command:
            - '/bin/bash'
            - '-c'
            - |
              curl -s -H 'Metadata-Flavor: Google' 'http://metadata.google.internal/computeMetadata/v1/instance/service-accounts/default/token' --retry 30 --retry-connrefused --retry-max-time 30 > /dev/null || exit 1
      containers:
        - image: image-name
...
```

# 終わりに

今回書いた内容を押さえておけば恐らくArgo Workflowsは問題なく使えると思われる。

今後どのワークフローエンジンが流行るのかわからないが、Argo Workflowsは極めて使いやすいため恐らく覇権を取れる気がする(?)
