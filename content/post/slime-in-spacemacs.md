+++
title="SpacemacsでSLIMEを導入してQuicklispを入れる"
date=2019-07-14
+++

Lispを書くときに必要不可欠とも言えるのがSLIMEですよね。

SLIMEとはLispをIDEっぽくするやつで、Lisperにとっては無くてはならないものです。

さて、今回はそんなSLIMEを今回Spacemacsで叩けるようにして最終的にQuicklispも使えるようにするのが目標です。

### 環境

ぼくの環境はmacOS Mojaveです。

あと、ぼくはシェルにXonshというやつを使っています。

もしかしたらこのXonshが微妙な悪さをしていて設定に悪影響を及ぼしている可能性があるのですが、とりあえず今回自分はこうしてうまくいったという1つの事例として留めておきます。

多分Linuxの人もそこまで導入に関しては大きく変わらないはず。

### Spacemacsが見ている設定ファイル

Emacsの場合、設定ファイルは

+ ~/.emacs.el
+ ~/.emacs
+ ~/.emacs.d/init.el
+ ~/.emacs.d/init

の順番に見ていって、最初に見つけたやつだけを設定ファイルとして読み込むそうです。

で、これに対してSpacemacsは

+ .spacemacs
+ ~/.emacs.d/init.el

の順番で両方を見ているようです(違ってたらごめんなさい)

ただ、色々調べてみたところ、どうもこの2つで役割が微妙に違うらしくて、なのでSpacemacsにSLIMEを導入するにはこの両方を触っていきます。

### まずはSLIME導入

まず `.spacemacs` の方にて、`(defun dotspacemacs/layers () ...` のところで、`common-lisp`を追加します。

[https://github.com/syl20bnr/spacemacs/tree/master/layers/%2Blang/common-lisp:embed:cite]

どうやら本来はこれでSLIMEが導入され、処理系としてはデフォルトでSBCLが導入されるらしいのですが、ぼくはこれがうまくいきませんでした。

で、ということで処理系の設定を`(dotspacemacs/user-config () ...`のところに`(setq inferior-lisp-program "/path/to/your/lisp")`と書き込みます。

ぼくの場合、HomebrewでインストールしたSBCLのパスは`/usr/local/bin/sbcl`だったので

```
(defun dotspacemacs/user-config ()
  (setq inferior-lisp-program "/usr/local/bin/sbcl"))
```

としました。

さて、これでSLIME自体は動きます。

Spacemacsを立ち上げ直して`hoge.lisp`なりテキトーなファイルを作ってあげて、それで`SPC SPC`でメタモードにして`slime`と打てばslimeモードを立ち上げられます。

### SLIMEの設定をいじる

`.spacemacs`の設定を以上のようにすればSLIMEは動くようになります。

で、今度はSLIME自体の設定をします。

まず`~/.emacs.d/`の中にSLIMEのリポジトリをcloneします。

```
cd ~/.emacs.d/
git clone git clone https://github.com/slime/slime.git
```

そうして、`~/.emacs.d/init.el`に以下のコードを追記します。

```
;; ~/.emacs.d/slimeをload-pathに追加
(add-to-list 'load-path (expand-file-name "~/.emacs.d/slime"))

;; SLIMEのロード
(require 'slime)
(slime-setup '(slime-repl slime-fancy slime-banner)) 
```

これでもう一度Spacemacsを立ち上げ直してSLIMEを起動すると、バナーが表示されるのがわかり、実際にちゃんとこの設定を読めていることがわかります。

ちなみに余談なのですが、先ほど`~/.emacs.d/init.el`に書いた`(add-to-list 'load-path (expand-file-name "~/.emacs.d/slime"))`を書かないと、ターミナルで`emacs`と売ったらなぜかSpacemacsではなく普通のEmacsが立ち上がるようになります。

なんででしょう....

もしかしたら`(require 'slime)`でSpacemacsではない普通のEmacsが呼ばれるようになっているからかもしれません。

誰か原因知ってる人がいたら教えてください。

ちなみにここで色々SLIMEの設定をいじることができるので自動補完等もEmacs Lispを書けばなんとかなります。

### Roswell使えないの？

Lispの処理系の導入とかパッケージ管理をひとまとめにしたRoswellですが、残念ながらRoswellとSpacemacsは相性が悪いようで、今回に関しては見送らざるをえないようです。

色々調べたんですけど、RoswellとSpacemacsはどちらも設定周りがかなりしっかりしてて、お互い相入れないようになってました。

多分かなり頑張ればいけるんでしょうけど、パッと見では無理そうだったので今回に関してはRoswellは使えません。

なのでこの後のQuicklispの導入もRoswellを使わずにSBCLに直接Quicklispを設定します。

### Quicklispの導入

さて、Quicklispを入れるのは比較的簡単で、基本的には公式サイトの通りにします。

[https://www.quicklisp.org/beta/:embed:cite]

まずホームディレクトリにQuicklispのインストールのためのソースコードを取ってきます。

```
curl -O https://beta.quicklisp.org/quicklisp.lisp
```

そうしてSpacemacs内でSLIMEを立ち上げ、その中で

```
(load "~/quicklisp.lisp")
(quicklisp-quickstart:install)
```

これで入ります。

さて、これでQuicklispのコマンドを少し叩いてみると

```
(ql:system-apropos "vecto")
```

ちゃんと動いてることが確認できると思います。

Spacemacsを立ち上げ直したとき、もしQuicklispが使えないってなったら

```
(load "~/quicklisp.lisp")
(quicklisp-quickstart:install)
```

をやり直して、それで`qlってパッケージないよ！`と言われたら

```
(load "~/quicklisp/setup.lisp")
```

とすればちゃんとQuicklispが使えるようになります。

### まとめ

以上でSpacemacsへの色々な導入ができました。

Spacemacsはかなり素敵なエディタだと思うんですけど、やっぱりマイナーなエディタであるのと同時にEmacsに比べると拡張性があまりないので使いづらいところがあるなぁって感じですね。

やっぱりRoswellと互換性ないのは痛いなぁ....
