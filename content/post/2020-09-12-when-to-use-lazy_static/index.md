---
layout:      post
title:       "const and static in Rust"
subtitle:    "Some macros help you avoid using global variables"
description: "Rust provides some syntax to allocate data to be able to be accessed globally. This article tells when you use properly."
date:        2020-09-12
author:      "Yusuke Kominami"
image:       "https://cdn.cheapoguides.com/wp-content/uploads/sites/3/2019/09/autumn-illuminations-kiyomizudera-iStock-SeanPavonePhoto-1024x600.jpg"
tags:        ["Rust"]
categories:  ["Tech"]
---

# Global variable in Rust

In functional programming, the way to use global variable properly is just to avoid using it.
This is not a joke. 
Modern software engineering requires variables to be scoped, and at the same time, they shouldn't be changed even in scopes such as closures.

However, we can't sometimes avoid using global variable (Somtimes codes can be cleaner.)
For such situations, Rust provides some syntax to controll global variables.

They are `const` and `static`.

To explain their functionality, let's take a easy example.

```rust
const X: usize = 0;

fn main() {
  println!("X = {}", X);
  X += 1;
  println!("X = {}", X);
}
```

When you try to compile this, you will face an error message.

```rust
error[E0067]: invalid left-hand side of assignment
 --> src/main.rs:5:5
  |
5 |   X += 1;
  |   - ^^
  |   |
  |   cannot assign to this expression
```

`const` variable can't be changed and can be accessed from any place.

On the other hand, this is compilable.

```rust
const X: usize = 0;

fn main() {
  unsafe {
    println!("X = {}", X);
    X += 1;
    println!("X = {}", X);
  }
}
```

This uses `unsafe` but `static` allows us to change itself.

OK, the next example is more clear.

```rust
use std::sync::atomic::{self, AtomicUsize};

const X: AtomicUsize = AtomicUsize::new(0);
static Y: AtomicUsize = AtomicUsize::new(0);

fn main() {
    for _ in 0..5 {
        println!("X = {}", X.fetch_add(1, atomic::Ordering::SeqCst));
    }
    for _ in 0..5 {
        println!("Y = {}", Y.fetch_add(1, atomic::Ordering::SeqCst));
    }
}
```

This code is from [here](https://qnighy.hatenablog.com/entry/2018/06/17/190000).
When you run, this prints below.

```bash
X = 0
X = 0
X = 0
X = 0
X = 0
Y = 0
Y = 1
Y = 2
Y = 3
Y = 4
```

`fetch_add` takes `&self`, so `&X` and `&Y` are calculated in this example.
About `const`, some anonymous local variable is allocated for each time, so the `const` variable looks unchanged.
In short, new variable initialized as `AtomicUsize` is generated for each iteration.

But `static` fixes the address of the variable.
So this is incremented for each iteration., which has `'static` lifetime.

To summarize, the difference between `const` and `static` is:

- `const` defines the value determined in compiling. This fixes value, not address.
- `static` defines the address, which will be set value in compiling. It isn't essential whether this is initialzied with value.


# How to use properly

`const` is really simple and easy to use.
But `static` is a little diffucult to understand and use.
In fact, `static` has cause to really step in it.

When you set global variable initialized with `static mut`, this often results in undefined behaviour.
For example, see this [link](https://play.rust-lang.org/?version=nightly&mode=debug&edition=2018&gist=4e947d6632d52f39536d42ff51136e1b).

```rust
#[derive(Debug, Clone)]
struct Node {
    children: Vec<usize>,
    last: usize,
}

impl Node {
    fn add(&mut self, next: usize) -> usize {
        self.children.push(next);
        self.last = next;
        next
    }
}

static mut NODES: Vec<Node> = Vec::new();

unsafe fn new_node() -> usize {
    let ret = NODES.len();
    NODES.push(Node { children: Vec::new(), last: 0 });
    ret
}

fn main() {
    unsafe {
        let mut last = new_node();
        for _ in 0..30 {
            last = NODES[last].add(new_node());
        }
        for node in &NODES {
            println!("{}", node.last);
        }
    }
}
```

In this code, `NODES` should be set as 0 -> 1 -> 2 -> ... -> 30.
But the result is below.

```rust
1
2
3
0
5
6
7
0
9
10
11
12
13
14
15
0
17
18
19
20
21
22
23
24
25
26
27
28
29
30
0
```

The reason for such a phenomenon is `static mut` has global pointer.

To avoid this, you should avoid using global variable.
Or use `thread_local!` macro.

Global poiter can be dangerous, so it's safer to restrict scope of global variable.


# thread_local! and lazy_static!

## thread_local! macro

`thread_local!` is really useful to handle safely global variable.
This macro allocates static data like raw `static` but this allocates for each thread (not global).

```rust
use std::cell::RefCell;

thread_local! {
    static X: RefCell<usize> = RefCell::new(0);
}

fn main() {
    X.with(|a| {
        *a.borrow_mut() += 1;
    })
}
```

To use it, you have to borrow with `with` method and make closure.

You can use static data safely without undefined behaviour.

## lazy_static! macro

If you want to initialize global variable with some data (ex. File I/O), this is useful.
There are some situations where you want to read some configuration files or dictionary data in advance and put the contents of those files globally.

In Rust, it is possible to create global variables by using `static`, but it is not usable in the above situation because the expression used for initialization must be evaluated at compile time.

```rust
#[macro_use]
extern crate lazy_static;

use std::sync::Mutex;

lazy_static::lazy_static! {	
    static ref X: Mutex<usize> = Mutex::new(0);	
}

fn main() {
    *X.lock().unwrap() += 1;
}
```

