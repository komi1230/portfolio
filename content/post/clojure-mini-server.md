+++
title="Clojureで超絶極小サーバーを立てる"
date=2019-10-28
+++

先日の奨学金返金エントリーに対して辛辣なコメントが飛び交っており心を痛めている今日この頃。

このエントリーは返納までの期日が超絶短期間に設定されたことを問題視したものだったのだけれど、返金することになったことへの批判と擁護が予想以上に飛んできて色々想定外で<b>いやそうじゃないんだよなぁ</b>という感情しかなかったのでいくつか追記しておいた。

多分もう大丈夫だと思われる。

さて、前置きという名のボヤキはここらへんにしておいて、最近もちまちまとClojureの勉強を進めている。

今日はClojureのサーバーの立て方とその周りの云々やっていて、その際に色々つまづいたものをここでテキトーにまとめておこうと思う。

### 概要

Pythonでサーバーを立てる場合、ターミナル上で

```
$ python -m http.server 8080
```

としたり、もしくはソースコードとして

```python
import http.server
import socketserver

PORT = 8000
Handler = http.server.SimpleHTTPRequestHandler

with socketserver.TCPServer(("", PORT), Handler) as httpd:
    print("serving at port", PORT)
    httpd.serve_forever()
```

と書いてこれを実行することでサーバーを立てることができる。

PythonにはWSGI(Web Server Gateway Interface, ウィズギーと呼ぶらしい)というWebアプリケーションとWebサーバーの間をなすインターフェースがあり、WebアプリケーションとWebサーバーの実装を切り離すことで柔軟なアーキテクチャ設計ができるようになっている。

そんなアプリケーションとサーバーの間のクッションだが、JavaではそのインターフェースとしてJava Servlet APIがあり、そしてClojureの場合は<b>Ring</b>というものがその役割を果たしている。

### プロジェクトを立ち上げる

さて、概要はなんとなく掴んだのでいざ実装。

ClojureのプロジェクトはLeiningenを使ってビルドしていくので、まずプロジェクトを立ち上げる。

```
$ lein new app mini-server
$ cd mini-server
```

これで`app`をベースとしたプロジェクトディレクトリができる(デフォルトでは`library`をベースとしている)

ClojureはPythonと違ってREPLに入ったあとに自由にモジュールをimportできるわけではなく、最初にプロジェクトファイルに何のモジュールを使うか書いておく必要があるのでこれを記述する(別にプロジェクトファイルに書かずとも何とかなる方法はあるが割愛)

`project.clj`にて`dependencies`にRingを追記する。

```clojure
(defproject mini-server "0.1.0-SNAPSHOT"
  :description "FIXME: write description"
  :url "http://example.com/FIXME"
  :license {:name "EPL-2.0 OR GPL-2.0-or-later WITH Classpath-exception-2.0"
            :url "https://www.eclipse.org/legal/epl-2.0/"}
  :dependencies [[org.clojure/clojure "1.10.0"]
                 [ring "1.7.1"]]
  :main ^:skip-aot mini-server.core
  :target-path "target/%s"
  :profiles {:uberjar {:aot :all}})
```

ちゃんとバージョンを書いておく必要あり。

これでターミナルにてLeiningenのREPLを起動すると必要なモジュールを用意してくれるのでターミナルにて早速使ってみる。

まずREPLを起動。

```
$ lein repl
```

そして動かしてみる。

```clojure
mini-server.core=> (require '[ring.adapter.jetty :as s])
;; => nil
mini-server.core=> (def server (atom nil))
;; => #'mini-server.core/server
mini-server.core=> (reset! server 
              #_=>         (s/run-jetty (fn [req] 
              #_=>                        {:body "Hi ! This is test server !"}) 
              #_=>                      {:port 3000 :join? false}))
```

途中の引数にて`:join?`はtrueの場合スレッドをサーバーが止まるまでブロックするのでREPLに帰ってこれなくなるためfalseにしておいた。

これを実行してブラウザにて[localhost:3000](http://localhost:3000)を見てみると

```
Hi ! This is test server !
```

と表示されていると思う。

さて、動いていることが確認できたので今度はサーバーを止める。

```clojure
mini-server.core=> (.stop @server)
;; => nil
mini-server.core=> (reset! server nil)
;; => nil
```

### まとめ

今回はClojureでRingを使って簡単なHTTPリクエストを送るサーバーを実装した。

これからはもっとサーバーのライフサイクルをもっと簡潔に扱えるようなものを作り、ミドルウェアなども作っていこうと思う。

とりあえず今日はここまで。

### 余談

エントリーを書いてるときブラウザでのフォントが等幅フォントではないのでコードの部分のインデントを合わせるのが若干めんどくさい。

かといって今のフォントは読みやすいので記事を書いているときだけ別のフォントに切り替えることができたら色々捗りそう。

ここらへんもそのうち模索してみる予定。

### 出典

+ [ClojureでWeb開発をはじめてみよう](http://ayato-p.github.io/clojure-beginner/intro_web_development/index.html)
+ [ミニマリストのためのClojure REST API開発入門](https://qiita.com/lagenorhynque/items/b15689e5432e0170b172)
