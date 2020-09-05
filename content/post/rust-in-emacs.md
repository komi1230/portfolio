+++
title="EmacsでRustの開発環境を整える"
date=2020-08-26
+++

今までRustの開発はrust-modeに委ねていたのだけど、ふとツイッターでrusticなるものを知った。

試しに入れてみたら開発環境の構築がかなり簡単に片付いて色々リッチになったのでメモ。

設定は以下の通り。

```
;; Rust
(require 'rustic)
(setq-default rustic-format-trigger 'on-save)
(setq rustic-rustfmt-bin "~/.cargo/bin/rustfmt")
(add-to-list 'rustic-rustfmt-config-alist '("edition" . "2018"))
(setq lsp-rust-analyzer-server-command '("~/usr/local/bin/rust-analyzer"))
```

実を言うとそこまでリッチにしなくても良い感はあって、ある程度補完が効いて型情報などが取れればいい感があるのだけど、今回環境構築をするついでにformatterが自動で効くようにした。

これは2, 3行目のところで、ファイルを保存した際にCargoでインストールした`rustfmt`が走るようになっている。

4行目の`add-to-list`のところについて、rusticのformatterはなぜかデフォルトでeditionが2015となっていて、`async`構文を見るとformatterがエラーを吐いてしまう。

なのでconfigにeditionが2018であることを明記する必要があった。

LSPのサーバーには`rust-analyzer`を使っていて、自分はHomebrew経由でインストールしているのでパスをこのように記述した。

rust-analyzerのインストールは以下の通り。

```bash
brew install rust-analyzer
```

自分の今のところのRustの開発環境はこんな具合。

Rust楽しんでいくぞ〜〜〜
