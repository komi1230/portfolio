---
layout:      post
title:       "LoadBalancerとしてEnvoyを導入する"
subtitle:    "GKEとgRPCでの環境にて利用"
description: "gRPCアプリケーションにてIngressからのリクエストに対してL7レイヤで動作するロードバランサを構築する"
date:        2021-11-15
author:      "Yusuke Kominami"
image:       "https://oceanvodka.com/uploads/2019/04/HP-Hero-Header@2x.jpg"
tags:        ["Kubernetes", "Envoy"]
categories:  ["Tech"]
---

# Envoyとは

EnvoyはL4/L7レイヤで動作するプロキシで、ロードバランスだったりネットワークとアプリケーションの分離なり、とても柔軟使えるOSS。
ネットワーク関係の色々困りごとを解消してくれる優れものだったりする。

開発元はLyftで、急速に普及したマイクロサービスの分散システム構築・運用を安定させるため2015年5月から始まったプロジェクト。

実装言語としてはC++が使われている。

今回の記事では、そんなEnvoyをKubernetes上で動作するgRPCに対して適用させる。

# gRPCアプリとEnvoy

gRPCとはHTTP/2上で動作するプロトコルで、JSONの強いバージョンみたいなもの。

HTTP/2は普段慣れ親しんでいるHTTP/1.1と何が違うかというと

- バイナリベース
- ヘッダー圧縮
- ストリーム

などの差分がある。

1つ目のバイナリベースというのは、HTTP/1.1はテキストベースのプロトコルで各リクエストを受け取った際はテキストからバイナリへパースしてあげる必要があったのだけど、それが無駄ということでHTTP/2からはバイナリがデフォルトになり通信が高効率になった。

2つ目のヘッダー圧縮というのは、ヘッダー情報にはどのHTTPメソッドを使っているかとかアクセスしているホストはどれだとか色々情報が格納されているのだけど、これを同じホストに対して複数回リクエストを飛ばすようなケース(Webサイトに対してHTMLファイルをリクエストしたあとCSSファイルをリクエストしたりする場合など)だとヘッダ情報には同じような情報ばかりでもう一度大量のヘッダ情報を送るのは無駄となってくる。
そのようなケースに対応するためにHTTP/2ではヘッダ情報には変更があった分だけ送るように変更される。

3つ目のストリームは、もともとHTTP/1.1ではリクエストとレスポンスの組を1つずつしか同時に送受信できず、これがボトルネックとなっていたことからHTTP/2ではストリームという仮想的な双方向シーケンスを作り、それを多重化することで柔軟な通信が実現できるようになった。
ちなみにこの双方向シーケンスというとWebSocketにも同様の機能が提供されているのだけど(WebSocketの方がHTTP/2より簡単な実装になっている)、ここらへんの話は非常に長くなるのでまた別の機会に。

今回出てくるgRPCはHTTP/2上で動作するプロトコルで、これは非常に高速で優秀であるが実はロードバランサと少々相性が悪い。
というのもHTTP/2の特徴としてストリームがあり、これはサーバーとクライアントの間のコネクション上にピタッと張られるもので、負荷が大きくなった際にサーバーを水平スケールさせるためには多少の工夫が必要となる。
つまり意図的にTLS終端を担ってくれるアプリケーションを中間に用意して別途アプリケーションへネットワークをリレーしてもらわないとHTTP/2の世界ではロードバランスできない。

そこで今回出てくるのがEnvoyで、Serviceから飛んできたリクエストを一旦Envoyが受け取り、ロードバランスを考えてどのPodに受け渡すかを上手いことやってくれる。

![load_balancer_image](https://i-beam.org/2019/02/03/envoy-static-load-balancer/envoy-http-proxy.png)

# 実装する

ということでマニフェストを眺めていく。

まずEnvoyはDeploymentにてサイドカーとして立てるので、以下のように並べてあげる必要がある。

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: my-server
spec:
  selector:
    matchLabels:
      app: my-server
  template:
    metadata:
      labels:
        app: my-server
    spec:
      containers:
        - name: my-server
          image: gcr.io/my-app/some-image:latest
          args:
            - /bin/ls
          ports:
            - name: web
              containerPort: 8888
          volumeMounts:
            - mountPath: /tmp
              name: tmp
        - name: envoy
          image: envoyproxy/envoy:v1.20.0
          command:
            - "/usr/local/bin/envoy"
          args:
            - "--config-path /etc/envoy/envoy.yaml"
          resources:
            limits:
              memory: 512Mi
          ports:
            - containerPort: 15001
              name: app
            - containerPort: 8001
              name: envoy-admin
          volumeMounts:
            - name: envoy
              mountPath: /etc/envoy
      volumes:
        - name: envoy
          configMap:
            name: my-envoy-configmap
```

ポイントとしてEnvoyはAdmin用のポートとアプリケーションとしてのポートを別途開けておく必要がある。

そしてEnvoyをどのように動作させるかはConfigMapに記述をする。

以下がEnvoyのConfigMapとなる。

ちなみに以下の文法はEnvoyのv3 APIで、v1やv2とはやや異なることに注意。

```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: my-envoy-configmap
data:
  # Adding new entries here will make them appear as files in the deployment.
  # Please update k8s.io/k8s.io/README.md when you update this file
  envoy.yaml: |
    static_resources:
      listeners:
      - address:
          socket_address:
            address: 0.0.0.0
            port_value: 15001
        filter_chains:
        - filters:
          - name: envoy.filters.network.http_connection_manager
            typed_config:
              "@type": type.googleapis.com/envoy.extensions.filters.network.http_connection_manager.v3.HttpConnectionManager
              codec_type: AUTO
              stat_prefix: ingress_http
              route_config:
                name: local_route
                virtual_hosts:
                - name: backend
                  domains:
                  - "*"
                  routes:
                  - match:
                      prefix: "/"
                    route:
                      cluster: local_service
              http_filters:
              - name: envoy.filters.http.router
                typed_config: {}
      clusters:
      - name: local_service
        type: STRICT_DNS
        lb_policy: ROUND_ROBIN
        load_assignment:
          cluster_name: local_service
          endpoints:
          - lb_endpoints:
            - endpoint:
                address:
                  socket_address:
                    address: local_service
                    port_value: 2746
    admin:
      access_log_path: "/dev/null"
      address:
        socket_address:
          address: 0.0.0.0
          port_value: 8001
    layered_runtime:
      layers:
        - name: static_layer_0
          static_layer:
            envoy:
              resource_limits:
                listener:
                  example_listener_name:
                    connection_limit: 10000
```

だいたいは引数名を見ればどういう設定をしてるかがわかるが、`listers`内のフィルタ周りのところでどのドメインから来たリクエストをどのクラスタへルーティングする記述があり、ここで送るクラスタは`clusters`と同じ名前を設定する必要がある。

# 終わりに

仕事でEnvoyを触る必要があり色々ググってみたところv3 APIの日本語記事が少なかったので書いてみた。

ここらへんの実装を終えてから実は要件としてEnvoyは必要がなかったということが発覚したのだけど、今回色々調査しながらEnvoyを触ったのでメモ。
