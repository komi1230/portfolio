+++
title="	Common LispのソースコードからUnixコマンドを叩く"
date=2019-12-23
+++

やや久しぶりの更新。

最近はあまりLispを書いてなくて、ずっとベイズ深層学習の勉強をしている。

先日なんとなく書店をフラフラしていたところコンピュータサイエンス系の棚にて須山さんの『ベイズ深層学習』を発見し、勢いで購入したのだけれどこれがなかなか面白い。

いわゆる頻度論的なアプローチとベイズ的なアプローチをうまく対比させていて、どう異なっていてどう共通部分を見出せるかについてかなり簡潔に説明されており、ベイズについては1年前にPRMLを読んだだけだったので久しぶりにしっかり手を動かして読み進めている。

そういえばCommon Lispでベイズ系のライブラリは無かった気がするので実装しようかなという構想がある。

ベイズ推論は尤度関数などをしっかり計算しようとするとなかなか計算量がハードで、ベイズ推論パッケージであるStanは記述されたモデルを一度C++にトランスレートして計算しているので、C並みの速度が出るCommon Lispならマクロなどを活用することでCommon Lispネイティブで実装ができると踏んでいる。

Common Lispでやりたいことはたくさんあるのだけれど、時間が空き次第しっかり開発に着手しようと思う。

さて、本題へ。

### ソースコードからUnixコマンド

PythonなどでUnixコマンドを叩こうとする際は `subprocess` を使うことでなんとかできる。

```python

import subprocess as sp

sp.call("pwd")
# => "/path/to/your/current/directory"
```

引数ありのUnixコマンドを叩く際は、引数にリストとして入れてあげればできる。

```python
import subprocess as sp

sp.call(["ls", "Desktop"])
```

このようにソースコードからUnixコマンドを叩くことができると色々なツールのラッパーを簡単に作成することができる。(例えばGnuplotとか)

さて、こうしたUnixコマンドをソースコードから叩くのをCommon Lispでやるのはややめんどくさい。

というのも処理系依存だからである。

例えば自分が普段から使っているSBCLは `sb-ext:run-program` で、

```sbcl
(sb-ext:run-program "/bin/ls" '("Desktop") :output t) 
```

という具合になる。

しかしこれはSBCLの場合で、CLISPやCCLとなるとまた変わってくる。

ちなみにSBCLではこの `sb-ext:run-program` によって解決できるが、SLIMEでこれを使おうとするとまた別の問題が起こり、標準出力ができずに失敗するのでstreamとして渡してあげる必要がある。

まあ要するに汎用的なコードを書くには問題だらけなのである。

### trivial-shellという選択

さて、Common Lispには `trivial-shell` というライブラリがある。

これは上記の問題を解決するために用意されたもので、簡単に使える。

例えば

```lisp
(ql:quickload :trivial-shell)

(defun system (cmd-str)
 (trivial-shell:shell-command cmd-str))
```

とすれば `(system "ls")` のようにして使え、Pythonの `subprocess` とほぼ同様のインターフェースが実現できる。

この `trivial-shell` は上記のSLIMEでの問題も解決している。

だいたいはこれで問題なさそう。

ただ一つ文句をつけるとすれば、`ls` での結果表示が `#\Newline` によって改行されており、結果をリストとして表示するにはちょっと一手間を加える必要がある。

自分は上記の画像の通り、以下のようなやり方で解決している。

```lisp
(ql:quickload :trivial-shell)

(defun system (cmd-str)
 (trivial-shell:shell-command cmd-str))

;; split関数を用意
(defun split (x str)
  (let ((pos (search x str))
        (size (length x)))
    (if pos
      (cons (subseq str 0 pos)
            (split x (subseq str (+ pos size))))
      (list str))))

;; split関数によって改行でリストごとに切っていく
(split (string #\Newline) (system "ls"))
```

これで良さげ。

### 終わりに

自分は今のところCommon LispでUnixコマンドが欲しくなることはあまり無かったのだけど(せいぜいカレントディレクトリを見るくらいで `sb-posix:getcwd` で解決する)、今日後輩からその手の質問をされて気になったので自分で今回調べてみた。

自分はCommon Lispではアルゴリズムについてよく考える一方でシステムについてあまり触らないので、たまにはこういうのも面白いかもなと思ったり。

勉強になった。
