---
layout:      post
title:       "Chromeでfont-familyを正しく設定する"
subtitle:    "-apple-systemとBlinkMacSystemFont"
description: "このブログで日本語フォントが中華フォントに化けてしまう問題とその直し方"
date:        2021-08-11
author:      "Yusuke Kominami"
image:       "https://i1.wp.com/nobon.me/wp-content/uploads/2013/03/1920x1080_08-001.jpg?fit=1920%2C1080&ssl=1"
tags:        ["Chrome", "macOS", "font"]
categories:  ["Tech"]
---

# Chromeでのみフォントが正しく読まれない問題

先日にブログを作り直し、現在はHugoを使ってGitHub Pages上でホスティングしている。
前までブログにははてなブログを利用していたのだが、広告が鬱陶しいと感じたため自分でホスティングし直すことにした。

そんなわけでHugoのデザインテンプレートを利用したりして現在のブログがあるわけだけど、いつからかフォントが妙な動作をしていた。
というのも、SafariやiPhoneで見てみると正しく日本語のフォントが見えているが、なぜかChromeでのみフォントが中華フォントになっていた。

コードを読み直してみてもカスタムCSSが適切に配置してある。
前まではChromeでもちゃんと動いていた気がするが、なにが起きていたのだろう。

# `-apple-system`と`BlinkMacSystemFont`

使用していたデザインテンプレートのCSSではfont-familyに`-apple-system`と書いてあった。
これをググってみると、どうやらSafariでは`-apple-system`というのをfont-familyに指定しておけば英字書体にAppley用の英字フォント(San Francisco)が適用されるらしい。

ChromeでApple用英字フォントを使うには`BlinkMacSystemFont`を指定する必要があるらしく、どうやらこれはWebkitから派生したレンダリングエンジン用フォントらしい。

これを適切に動作させるには`-apple-system`と同時に`BlinkMacSystemFont`とも書いておく必要があったとのこと。

# 結局どうしたか

特段フォントに対してこだわりはないので全て以下の通りに設定した。

```css
font-family: Helvetica,"Sawarabi Gothic",Meiryo,"メイリオ","Hiragino Kaku Gothic ProN", "ヒラギノ角ゴ ProN",YuGothic,"游ゴシック",Arial,sans-serif; 
```

これでブラウザ依存の無いようにフォントが表示されるようになった。