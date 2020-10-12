---
layout:      post
title:       "Design RESTful API"
subtitle:    "Towards clean API architecture"
description: "REST is a principle of API architecturing and make system clean and maintainable. This article is about RESTful API and shows its examples."
date:        2020-10-12
author:      "Yusuke Kominami"
image:       "https://www.nagatoro.gr.jp/wp-content/uploads/2017/10/MG_8159.jpg"
tags:        ["REST", "Architecture"]
categories:  ["Tech"]
---

# About RESTful API

REST is abbreviation of REpresentational State Transfer, and is principles of architecturing to cooperate multiple softwares in distributed system, advocated by Roy Fielding in 2000.
REST is composed of four principles:

- Addressability
  - Addressability means all offered information can be represented via URI and each information has unique address represented by URI.
- Stateless
  - Stateless means API should be stateless client/server protocol based on HTTP. State is not managed by session, each handled information is complete and interpretable by itself.
- Connectability
  - Connectability means each information can be linked to another inside itself.
- Uniform Interface
  - Uniform Interface means every operation has to use HTTP method.


# Example

Each is really abstract and difficult to understand.
Let's take some easy examples.

## Case1

If you want to search about Japanese food, search software should offer these URI.

```bash
GET /search/sushi
GET /search/tenpura
```

URI has to represent resources. In this example, you can easily understand what each URI represent.

On the other hand, this is bad:

```bash
GET /search/sushi
GET /i-want-to-know/tenpura
```

Both means the same but the representation is different.
The same operation should be summarized.

## Case2

Assume you are making some SNS.
SNS offers user accounts and they can be deleted.

When you delete account, this API should be following.

```bash
DELETE /account/1
```

Bad pattern is like this:

```bash
GET /account/1/delete
```

In REST API, URI shouldn't be composed of verb, and it has to represent resources.
In this bad case, `/delete` is not resource but operation.
