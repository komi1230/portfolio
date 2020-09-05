+++
title="SLIMEからOpenGLを触る"
date=2019-12-01
+++


Lispの開発においてSLIMEは必須のものであり生命線。

これがあるとないとでは開発効率は10倍以上は変わるだろうし、LispをLispたらしめている要因の一つであるのがSLIMEなんだと思う。

そんなSLIMEを使って現在は開発を進めているのだけれど、実は一つ問題が発生していた。

現在趣味でCommon Lispでグラフィック系のものを作っているのだけれど、SLIMEからだとウィンドウが立ち上がらないのである。

これがSLIMEで長いこと目の上のタンコブであったわけだけど、今回なんとか解決したのでメモ書き。

### 概要

環境はmacOS CatalinaでSBCLのバージョンは1.5.7.55、Emacsは26.3。

そもそもSLIMEとはEmacs起動中に裏側でLispのREPLを起動したサーバーを立てておいて、それをエディタからそのREPLに通信するという方式をとっている。

今回問題が起きていたのは、SLIMEのREPLサーバーに対しての通信方式で、デフォルトだと通信に個別のスレッドを使用する方法を採用している。

これだとREPL上の白黒のデータを動かすようなスレッドはちゃんと動いてもグラフィック系のような別ウィンドウを立ち上げるものはうまくいかない(個別のスレッドなのでデータのやり取りが途切れてしまう)。

なので、SLIMEの通信方式をデフォルトの個別のスレッドを使用する方式からループアプローチに変更する必要がある。

### コード

自分の環境では、Emacsの設定ファイルはホームディレクトリに設定ファイルを格納したファイルを入れており、SLIMEはそのディレクトリ内に格納している。

実際、

```
~/.emacs.d
├── init.el
├── slime/
│   ├── swank.lisp
│   ├── README.md
...
```

というような構造をとっている。

SLIMEの利用に関しては`init.el`の中にて`(add-to-list 'load-path (expand-file-name "~/.emacs.d/slime"))`としてSLIMEのファイルをロードしている。

さて、今回変更を書き加えるのはこの`~/.emacs.d/slime/`内の`swank.lisp`。

まず、先ほど述べた通り、SLIMEの通信方式を変える。

この`swank.lisp`の130行目あたりから始まるConnectionのところにて、`*communication-style*`を`nil`から`:fd-handler`にする。

```lisp
(defstruct (connection
             (:constructor %make-connection)
             (:conc-name connection.)
             (:print-function print-connection))
  ;; The listening socket. (usually closed)
  (socket           (missing-arg) :type t :read-only t)
  ;; Character I/O stream of socket connection.  Read-only to avoid
  ;; race conditions during initialization.
  (socket-io        (missing-arg) :type stream :read-only t)
  ;; Optional dedicated output socket (backending `user-output' slot).
  ;; Has a slot so that it can be closed with the connection.
  (dedicated-output nil :type (or stream null))
  ;; Streams that can be used for user interaction, with requests
  ;; redirected to Emacs.
  (user-input       nil :type (or stream null))
  (user-output      nil :type (or stream null))
  (user-io          nil :type (or stream null))
  ;; Bindings used for this connection (usually streams)
  (env '() :type list)
  ;; A stream that we use for *trace-output*; if nil, we user user-output.
  (trace-output     nil :type (or stream null))
  ;; A stream where we send REPL results.
  (repl-results     nil :type (or stream null))
  ;; Cache of macro-indentation information that has been sent to Emacs.
  ;; This is used for preparing deltas to update Emacs's knowledge.
  ;; Maps: symbol -> indentation-specification
  (indentation-cache (make-hash-table :test 'eq) :type hash-table)
  ;; The list of packages represented in the cache:
  (indentation-cache-packages '())
  ;; The communication style used.
  (communication-style :fd-handler :type (member nil :spawn :sigio :fd-handler))  ;; この部分！
  )
```

次に、`swank.lisp`の最後の方にて、`(defun before-init ...`に`(setq *communication-style* nil)`と書き加える。

```lisp
(defun before-init (version load-path)
  (pushnew :swank *features*)
  (setq *swank-wire-protocol-version* version)
  (setq *load-path* load-path)
  (setq *communication-style* nil))  ;; この部分！
```

この2つをやれば動くようになった。

果たしてこれが正しいのかはわからないけど、とにかく動くようになって作業が捗るようになったので良いと思う。

### まとめ

今回はSLIMEの設定ファイルを直接いじることによってSLIMEからCL-OpenGLを叩けるようにした。

なんとか解決したので、ようやく開発にスピード感が出てくると思われる。

がんばっていきたい。
