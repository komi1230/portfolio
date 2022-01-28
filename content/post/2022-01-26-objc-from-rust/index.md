---
layout:      post
title:       "RustからCocoaを触る"
subtitle:    "コンパイルの際のリンクとframeworkについて"
description: "RustからmacOSのAPIであるCocoaを触る際、どのようにリンクが行われるかについて見ていく"
date:        2022-01-26
author:      "Yusuke Kominami"
image:       "https://i.natgeofe.com/n/04505c35-858b-4e95-a1a7-d72e5418b7fc/steep-karst-cliffs-of-el-nido-in-palawan.jpg"
tags:        ["Rust", "macOS"]
categories:  ["Tech"]
---

# Cocoaとは

CocoaとはmacOSのAPI群の総称で、macOSに関する様々な機能がまとめてある。
例えば画面にウィンドウを描画する`NSView`だったりOSのバージョンを出してくれる`NSOperatingSystemVersion`などがある。
macOSは基本的にObjective-Cで実装されており、オブジェクト指向な設計となっているので自分たちでAPIを利用したアプリケーションを作る際は特定のクラスからサブクラスを作成して機能群を追加していくような具合となる。

このライブラリ系はmacOSでは`/System/Library/Frameworks/`を見てみると様々なframeworkが入っている。ここでframeworkとは動的共有ライブラリや nibファイル、imageファイル、ローカライズファイル、ヘッダファイル、ドキュメント等のリソースファイルを１つのパッケージにまとめたディレクトリ。

# Rustから触る

Rustはlinkアトリビュートを持っており、これを以下のように用いることで使える。

```rust
#[link(name = "AppKit", kind = "framework")]
extern "C" {}
```

このコードではAppKitというframeworkを利用する際の宣言で、これによりobjcクレートを用いて

```rust
use objc;

fn main() {
  let cls = unsafe { objc::class!(NSView) };
}
```

として使える。

ちなみにlinkアトリビュートは`extern`とセットじゃないと意味がないらしく、

```rust
use objc;

#[link(name = "AppKit", kind = "framework")]
fn main() {
  let cls = unsafe { objc::class!(NSView) };
}
```

というコードではエラーを吐いてしまう。

`objc::class!`マクロは内部的に

```rust
#[macro_export]
macro_rules! class {
    ($name:ident) => ({
        #[allow(deprecated)]
        #[inline(always)]
        fn get_class(name: &str) -> Option<&'static $crate::runtime::Class> {
            unsafe {
                #[cfg_attr(feature = "cargo-clippy", allow(replace_consts))]
                static CLASS: ::std::sync::atomic::AtomicUsize = ::std::sync::atomic::ATOMIC_USIZE_INIT;
                // `Relaxed` should be fine since `objc_getClass` is thread-safe.
                let ptr = CLASS.load(::std::sync::atomic::Ordering::Relaxed) as *const $crate::runtime::Class;
                if ptr.is_null() {
                    let cls = $crate::runtime::objc_getClass(name.as_ptr() as *const _);
                    CLASS.store(cls as usize, ::std::sync::atomic::Ordering::Relaxed);
                    if cls.is_null() { None } else { Some(&*cls) }
                } else {
                    Some(&*ptr)
                }
            }
        }
        match get_class(concat!(stringify!($name), '\0')) {
            Some(cls) => cls,
            None => panic!("Class with name {} could not be found", stringify!($name)),
        }
    })
}
```

という具合で`objc::runtime::objc_getClass()`という関数を叩いてクラスを呼び出しており、この関数自体は

```rust
/// A marker type to be embedded into other types just so that they cannot be
/// constructed externally.
type PrivateMarker = [u8; 0];

/// A type that represents an Objective-C class.
#[repr(C)]
pub struct Class {
    _priv: PrivateMarker,
}

#[link(name = "objc", kind = "dylib")]
extern "C" {
  ...
  pub fn objc_getClass(name: *const c_char) -> *const Class;
  ...
}
```

というようにObjective-Cの関数となっている。

これらを用いてmacOSの機能を利用することができ、RustからMetalを触ることなどができる。

# 終わりに

ここ数日AlacrittyのIME対応のPRを出してやり取りしているのだけど、この実装の中でmacOSのクレート周りが非常に使いづらいことに気がつき、試験的に自分でmacOSのAPIラッパーを書けるか試していた。
そんな中で今回Rustのリンカー周りの挙動が気になったので調べてみた次第。