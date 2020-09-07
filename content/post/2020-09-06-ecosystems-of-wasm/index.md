---
layout:      post
title:       "Tools and Ecosystem of WebAssembly with Rust"
subtitle:    "About WebAssembly using Rust and wasm-bindgen"
description: "There are many tools around WebAssembly, and they are a bit complicated. Here you can find some clue to develop application using WebAssembly."
date:        2020-09-06
author:      "Yusuke Kominami"
image:       "https://www.aussiespecialist.com/content/asp/en/sales-resources/fact-sheets-overview/weather/_jcr_content/hero/mobile.adapt.768.high.jpg"
tags:        ["Rust", "WebAssembly"]
categories:  ["Tech"]
---

# About WebAssembly

First of all, you have to understand what WebAssembly is.

Mozilla says ...

> WebAssembly is a new type of code that can be run in modern web browsers — it is a low-level assembly-like language with a compact binary format that runs with near-native performance and provides languages such as C/C++, C# and Rust with a compilation target so that they can run on the web. It is also designed to run alongside JavaScript, allowing both to work together.

To tell simply, WebAssembly is fast language running on browsers.
And people say WebAssembly as WASM in an shortened name.

In developing some application running in browsers, you have to write JavaScript to express complicated logic and provide rich UI in client side.
Of course, it's OK if you want to **just** make application.
But sometimes JavaScript can be a bottleneck in application's performance.
For this, there are two reasons:

- Big binary size: JavaScript has big runtime
- Slow: To compile JavaScrit takes high cost

JavaScript can express complicated logic and rich UI, but can be problem today's modern Web application.
For example, 3D game, AR/VR and computer vision takes high cost to work.
Because of this, modern browser expects faster system.

Here, it's WebAssembly to solve this problem.

For more information about WebAssembly, see [MDN](https://developer.mozilla.org/en-US/docs/WebAssembly).

# Tools

You have already grasped what WebAssembly is.
In the next stage, let's understand what tool there are in developing WebAssembly.

As a result, you can develop WebAssembly with C/C++, Go, Rust or etc.
You have many choice, but here I recommend Rust.

If you use C/C++, you have to use `emscripten` to compile your code into WebAssembly.
`emscripten` is used to import JavaScript from C/C++ and also outputs JavaScript from LLVMIR.
But `emscripten` cannot optimise codes and the ecosystem in developing is a little weak.

If you use Go, you can make WebAssembly code just by setting compile target.
But Go has garbage collection to manage computer memory, and the binary size can be larger (this kills WebAssembly's merit)

Then, your choice is only one: Rust.

When developing WebAssembly in Rust, `wasm-bindgen` makes your developing experience more comfortable.
`wasm-bindgen` is a tool to run Rust code in browsers, developed by Mozilla.
And this offers newer and better ecosystem than `emscripten`.

Actually, `emscripten` is also able to compile Rust code to WebAssembly.
Here I will compare `wasm-bindgen` with `emscripten`.

## emscripten

`emscripten` is compiler of C/C++ into asm.js or WebAssembly via LLVMIR.
But it's a little hard to use if you use only this.
As a helper tool for compiling with `emscripten`, there is `Binaryen`, which is kind of wrapper of `emscripten`.

So far, these are not only for Rust but for C/C++.
To compile Rust code into WebAssembly, you have to use `emscripten-sys`, `stdweb` and `cargo-web`.

- `emscripten-sys`: A crate for bindings of runtime of `emscripten` from Rust.
- `stdweb`: A crate for bindings of DOM from Rust.
- `cargo-web`: A build tool like npm. This includes `stdweb`.

These tools for Rust seems no longer developed since last commit is 1 year ago.

## wasm-bindgen

`wasm-bindgen` is a tool to run Rust in browser, developed by Mozilla.
This tool is used to import Rust code from JavaScript.

There are some helper tools for this.

- `wasm-bindgen`: A crate including types.
- `js-sys`: A crate to run JavaScript code in Rust.
- `web-sys`: A crate to help Rust use DOM.
- `wasm-bindgen-futures`: A crate to interact between Future type of Rust and Promise type of JavaScript
- `wasm-bindgen-cli`: A build tool to add runtime of FFI of Rust and JavaScript to wasm file made with `wasm-bindgen`, `js-sys` and `web-sys`.
- `wasm-pack`: A build tool to compile Rust code into wasm file and make package of npm.

# Start Project

OK, let's start WebAssembly project.

First, install `wasm-pack`.

```bash
$ cargo install wasm-pack
```

Next, make project directory with `wasm-pack`.

```bash
$ wasm-pack new {ProjectName}
```

Then, your directory will be like this:

```bash
.
├── Cargo.toml
├── LICENSE_APACHE
├── LICENSE_MIT
├── README.md
├── src
│   ├── lib.rs
│   └── utils.rs
└── tests
    └── web.rs
```

When starting WebAssembly project, you have to set `crate-type = ["cdylib", "rlib"]` in Cargo.toml to handle wasm file.
And make sure there is `wasm-bindgen` as dependencies in Cargo.toml.

In `src/lib.rs`, there is some functions to run alert function in browser as default.

Let's build your project and say Hello World !

```bash
$ wasm-pack build --target web
```

This target flag means `--target web` turns on including ES modules.

Then, you can find `pkg/` directory has been made.
In this directory, there are .wasm file and its helper or driber (for example, `*.d.ts` is type definition file)

Finally, make `pkg/index.html` and write like this:

```html
<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8">
    <title>hello-wasm example</title>
  </head>
  <body>
    <script type="module">
        import * as mod  from "./{ProjectName}.js";
        (async () => {
            await mod.default();
            mod.greet();
        })();
    </script>
  </body>
</html>
```

Here we want to import `.wasm` file, so we set `type="module"` in script tag. (if just `<script> ... </script/`, you cannot import files).

Now, your directory structure is like this:

```bash
.
├── Cargo.lock
├── Cargo.toml
├── LICENSE_APACHE
├── LICENSE_MIT
├── README.md
├── pkg
│   ├── README.md
│   ├── index.html
│   ├── {ProjectName}.d.ts
│   ├── {ProjectName}.js
│   ├── {ProjectName}_bg.d.ts
│   ├── {ProjectName}_bg.js
│   ├── {ProjectName}_bg.wasm
│   └── package.json
├── src
│   ├── lib.rs
│   └── utils.rs
├── tests
│   └── web.rs
└── target
    └── ...
```

Finally, run any server (for example, `miniserver` or `python -m http.server 8000`) and check browser.

![image](https://qiita-user-contents.imgix.net/https%3A%2F%2Fqiita-image-store.s3.ap-northeast-1.amazonaws.com%2F0%2F142910%2F416508d9-9013-d346-2eeb-ebcad6854455.png?ixlib=rb-1.2.2&auto=format&gif-q=60&q=75&s=70e6e041d6ffafa9112fd14c6087ccf7)

You are already WebAssembly developer!

# Other approach

Not convinced?
Then, run wasm file with Deno!

Make `add.rs`!

```rust
#![no_main]
#![no_std]

#[panic_handler]
fn panic(_info: &core::panic::PanicInfo) -> ! {
    loop {}
}

#[no_mangle]
pub fn add(a: i32, b: i32) -> i32 {
    a + b
}:
```

And compile it.

```bash
$ rustc --target wasm32-unknown-unknown add.rs 
```

Then, make `main.js`.

```javascript
const bin = Deno.readFileSync("./add.wasm");
const wasm = await WebAssembly.instantiate(bin);
const ex = wasm.instance.exports;
const add = ex.add;
console.log(add(1, 2));
```

Finally, run this.

```bash
$ deno run -A main.js
```

You can find this wasm file also works!

