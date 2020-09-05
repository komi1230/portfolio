+++
title="Zshでサブコマンドにエイリアスをあてる"
date=2020-03-09
+++


REPLを触っているとき過去の入力を遡ったり矢印キーを使って云々するってことはよくあること。

これがあると結構色々便利だったりする。

さて、Common Lispの処理系でREPLを起動するときあまりこれができないのでhogeという気持ちになってしまう。

普段使っているのは`Roswell`というもので、REPLを起動する際は

```
$ ros run
```

とする。

今回はこの`ros run`に対して`rlwrap`を効かせたい。

## エイリアスをあてる

zshの環境でエイリアスをあてるとき

```zsh
alias '[target-command]=[original-commands]'
```

という書き方をするが、この`target-command`にサブコマンド入りを入れることはできない。

具体的に

```zsh
# これは動かない
alias 'pip install=pip install --user'
```

は機能しない。

ということで`zshrc`にて関数を定義してやる。

```zsh
function ros() {
    if [[ "$1" == "run" ]]; then
        shift 1
        command rlwrap ros run "$@"
    else
        command ros "$@"
    fi
}      
```

これをしてやることによって、例えば`ros install hogehoge`とすると普通の`ros`コマンドが機能し、第一引数に`run`がある場合は`rlwrap ros run`が機能するよう条件分岐してくれる。

先ほどの`pip install`の例では

```zsh
function pip() {
  if [[ "$1" == "install" ]]; then
    shift 1
    command pip install --user "$@"
  else
    command pip "$@"
  fi
}
```

となる。
