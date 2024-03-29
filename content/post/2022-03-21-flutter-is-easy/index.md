---
layout: post
title: Flutterは全く難しくない
subtitle: 開発エコシステムの発達度と界隈のイタい人の存在
description: スマホ向けネイティブアプリの開発は思っていたより簡単で、特にこれらの分野のスキルの特殊性は無いとわかった
date: 2022-03-21
author: Yusuke Kominami
image: https://www.akamai.com/site/im-demo/perceptual-standard.jpg?imbypass=true
tags:
  - flutter
categories:
  - tech
---

# スマホアプリ開発は全く難しくない

前回のエントリーで起業した旨について書いたのだが、事業のコアとなるアプリケーションはWebサイトとしては展開せずスマホアプリに絞ることとなった。
今の会社はエンジニアは自分一人なので当然開発も自分しかやる人間がおらず(CEOはかなりテックがわかる人間だがデザインだけ手伝ってもらっている)、そんなこんなで現在はスマホ向けアプリ開発としてFlutterを書いている。

自分の今までの開発スキルとしてはWebフロントエンド(React)、バックエンド(Python, Rust, etc...)、
インフラ周り(Kubernetes、含む)、データ基盤といった具合でかなり広い分野をカバーしているのだが、実はスマホアプリというのは経験がなかった。
なので今回スマホ向けに展開していくという話を聞いたときは正直「(自分の未経験分野なんだよな...)」と身構えていたところがあった。

ただ完全に未経験ということは無くて、OSSでターミナルエミュレータの開発だったりグラフプロットライブラリだったりとOSなどのシステムプログラミングに近い分野を経験していたので、なんとなくの感覚はわかってはいるつもりだった。

ただ、今回触ってみての感想だが、とにかく簡単。
書いているときの感覚はReactと同じで、宣言的UIでパーツを作って組み合わせる。
宣言的UIということでReactと同様に状態管理をどうする的な問題は出てくるのだけど、これの解決方法としてはコンポーネント間で状態管理バケツリレーをするかReduxのような外部で状態管理してくれるライブラリを利用するかといった具合となる。

Reactよりも簡単だと思ったのはCSSと格闘しなくて良い点で、Flutterにはデフォルトでマテリアルデザインに準じたコンポーネントが用意されているので、これを場所と大きさを指定して配置するだけのパズルとなる。

とにかくこれは本当にソフトウェアエンジニアリングなのかと思う。
マインクラフトの方が難しい気がする。

# 界隈の人間が信じられなくなった


数年前の話だが新卒就活をしていたとき、当時の自分は機械学習に詳しい若手というような売り込み方で就活をしていた。
同時に**新卒800万芸**という「新卒でもスキルある若手なんだから年収800万よこせ」という芸風もやっていた。
思い返してみれば2020年頃はAIがバズワードとなっていた時代で(その中では終末期であったが)、少し理論的に機械学習がわかるというだけで結構需要がある時代だった。
そういった背景から年収800万くらいは貰えてもおかしくない、たしかに妥当な数字であったと思う。
余談だが自分は現在はほとんど機械学習をやっていない。

その頃に同世代でAndroidエンジニアのヤツと繋がったのだが、そいつは「Android開発は特殊スキルだから初任給はそれなりに期待するわ」といった旨の発言をしていた記憶がある。
当時は自分もスマホ向けアプリの知識がなかったので「まあきっと特殊なスキルなんだろうな」くらいの認識だった。
実際、ツイッターではスマホ向けアプリ開発は一部の人間にしかできないんだぞー的な空気感を一部の人間が出していた気がする。

そんなわけだが、先述した通り今回自分で開発してみて全くスキルの特殊性が感じなかった。
一体なんだったんだろう。
結局ブランディングだったのだろうか。
もちろん当時はFlutterは無かったのだろうけど、それでもそれに相当するインターフェースをiOSもAndroidも持っていたはずなので適切に開発作業を行えば問題なくこなせそうではある。

# スマホ向けアプリ開発は特殊スキルなのか

スマホ向けアプリは開発エコシステムが過度に発達した結果、誰でも開発できるようになっている。
しかもそれなりの水準のものが。

どうやら世の中にはFlutterに特化したエンジニア向けオンラインサロンがあるらしい。
なんだかそこまでスキル的に尖ってなくてもポジショニングだけ上手にやって情弱を食い物にする構図がスマホアプリ開発界隈にはあるような気がしている。

(ピュアにFlutter"自体"のコミッターは除き)Flutter界隈には近づかない方が良い気がしている、というのが今回Flutterを使えるようになっての学びだと思う。

