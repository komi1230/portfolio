---
layout:      post
title:       "List of File Format Indentifier"
subtitle:    "Small knowledge for forensics"
description: "There is a convenient command to check file format, file. But sometimes we have to check it without that command. This article shows identifiers."
date:        2020-10-25
author:      "Yusuke Kominami"
image:       "https://images.unsplash.com/photo-1456440234190-5ace46584c7c?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=crop&w=1950&q=80"
tags:        ["CTF", "Forensics"]
categories:  ["Tech"]
---

# What is format identifier ?

File has many types: .pdf, .docx, .zip or etc.
In many cases, we can easily grasp which type the file is by checking its name.

For example, if you take screen shot in macOS, the image file will be generated in your Desktop, and its name will be `Screen\ Shot\ 2020-10-25\ at\ 21.26.54.png`.

But sometimes we face to files with no identifier.
Then how can we check its type ?

The way for that is to check the beginning of the binary of that file.

Let's take an easy example.
Generate some PNG file.

Then, use `xxd` command.
This command dumps file as hex.

```bash
$ xxd sample.png

#  00000000: 8950 4e47 0d0a 1a0a 0000 000d 4948 4452  .PNG........IHDR
#  00000010: 0000 0218 0000 0154 0806 0000 0066 f645  .......T.....f.E
#  00000020: 9a00 000c 6369 4343 5049 4343 2050 726f  ....ciCCPICC Pro
#  ...
```

PNG file starts with `89 50 4E 47`.
This is identifier.

# List

Here is list.

|Type|Binary|
|:------------:|:------------:|
|png|89 50 4E 47|
|GIF(89a)|47 49 46 38 39 61|
|GIF(87a)|47 49 46 38 37 61|
|pdf|25 50 44 46 2D 31 2E 34|
|pdf|25 50 44 46 2D 31 2E 33|
|jpeg|FF D8 DD E0|
|jpg|FF D8 FF EE|
|zip|50 4b 03 04|
|mp3|FF F3 40 C0|
|wave|52 49 46 46 xx xx xx xx 57 41 56 45|
|mov|00 00 00 14 66 74 79 70 71 74 20 20 00 00 00 00 71 74 20 20 00 00 00 08 77 69 64 65|
|avi|52 49 46 46|
|mp4|00 00 00 20 66 74 79 70 69 73 6F 6D 00 00 02 00|
|exe|4D 5A|
