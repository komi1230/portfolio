---
layout:      post
title:       "Hello My New Blog"
subtitle:    "Make blog easily with Hugo and GitHub Pages"
description: "Inroduce myself and how to build this blog with Zola and GitHub Actions."
date:        2020-09-05
author:      "Yusuke Kominami"
image:       "https://imagesvc.meredithcorp.io/v3/jumpstartpure/image?url=https://timeincsecure-a.akamaihd.net/rtmp_uds/3281700261001/201907/714/3281700261001_6060963782001_6060490039001-vs.jpg?pubId=3281700261001&videoId=6060490039001&w=1280&h=720&q=90&c=cc"
tags:        ["zsh", "GitHub", "GitHub Actions", "GitHub Pages"]
categories:  ["Tech"]
---

# About me

Hello, my name is Yusuke Kominami.

I'm living in Japan, and working as a machine learning engineer.
I'm 23 years old and graguated from Kyoto University in this March.
When I was student, I majored in Bioinformatics.

Why am I a software engineer?  
Actually, I'm not interested in Biology, more interested in computing. So when I was in university, I just stuck on programming.

For more about me, see my [Twitter](https://twitter.com/komi_edtr_1230) or [LinkedIn](https://www.linkedin.com/in/yusuke-kominami-0419b1157/).

# Why to start Blog?

Today, it's more and more important to offer tech information.
This is because to do this makes me well-known in software developers community and able to get more opportunity.
In other aspects, modern computer system and Web programming are really complicated, and today there are many software engineers in the world.
This means there may be software developers who are stuck in the same problem at the same time.
But if someone developed some solution, others should see it to avoid wasting time.

That's why I started tech blog.

# How to build Blog

OK, we are ready to start blog.
Here we will use [Hugo](https://gohugo.io/) and [GitHub Actions](https://github.co.jp/features/actions).

Hugo is a static site generator, written in Go.
It's blazingly fast and really stable. 
And also there is a big community and there are so many [themes](https://themes.gohugo.io/).

GitHub Actions is a platform to build and deploy your blog.
The way to use this is really easy: just make a new repository and set a .yaml file in the repository.

## Setup Hugo

If you use macOS, you can get Hugo via Homebrew.

```bash
$ brew install hugo
```

For other OS, check [this page](https://gohugo.io/getting-started/installing/).

If OK, type below command to make sure you have Hugo.

```bash
$ hugo --version
```

Can you see some version info in your terminal?
Then, you are OK.

Next, we will make Blog repository.
Type below command.

```bash
$ hugo new site {YourBlogName}
```

In this `{YourBlogName}`, anything is OK.
For example, `hugo new site MyBlog`.
When done, you can see there is a directory named `{YourBlogName}` in your directory.

Let's dive into this directory.
Here we have some directoies and a config file.

```bash
.
├── archetypes
│   └── default.md
├── config.toml
├── content
├── data
├── layouts
├── static
└── themes
```

Hugo enables us to use site theme.
In this tutorial, we will use `clean-white`.
This is like this:
![clean-white-theme](https://d33wubrfki0l68.cloudfront.net/3e3bb42f218e575e83c1b79c8994ef3a64d9a308/1ead0/hugo-theme-cleanwhite/screenshot-hugo-theme-cleanwhite_hu435c281ca01e15ada1d8f6676d2e58a0_772679_1500x1000_fill_catmullrom_top_2.png)

Actually I use this theme in my blog (but customed a little).
I love this theme because this has many options and is really simple and cool.

Let's clone this repository into your local directory.

```bash
$ git clone https://github.com/zhaohuabing/hugo-theme-cleanwhite.git themes/hugo-theme-cleanwhite
```

Next, edit `config.toml` to reflect this theme.
To do this, add `theme = "hugo-theme-cleanwhite"`

Then, your config file is like this.

```toml
baseURL = "http://example.org/"
languageCode = "en-us"
title = "My New Hugo Site"
theme = "hugo-theme-cleanwhite"
```

OK, let's build this site.
Type below command.

```bash
$ hugo server
```

Good job!
You already have your own site!

Do you want to add some article?
Just add some markdown file.

```bash
$ hugo new post/hello-world.md
```

Then you can see this new article in your site.

### Furthermore

This theme has many options: sidebar, feature tags, SNS link, or more.
If you want to turn on these options, see [this config of examle site](https://github.com/zhaohuabing/hugo-theme-cleanwhite/blob/master/exampleSite/config.toml).

As a side note, this blog's config is like this:

```toml
baseURL = "http://komi.dev"
languageCode = "en-us"
title = "Launch Today"
theme = "hugo-theme-cleanwhite"
preserveTaxonomyNames = true
paginate = 5
hasCJKLanguage = true

[outputs]
home = ["HTML", "RSS"]

[params]
  custom_css = ["css/custom-font.css"]

  header_image = "img/home.jpg"
  SEOTitle = "Kominami Blog"
  description = "Yusuke Kominami's Blog. About software engineering, career, lifestyle."
  keyword = "Yusuke Kominami, 小南佑介, 小南 佑介, Rust, Emacs, Lisp, Web, Machine Learning, 機械学習"
  slogan = "Playground and Workspace for Awesome Ideas"

  title = "Launch Today"
  thumbnail = "img/home.jpg"

  image_404 = "img/404-bg.jpg"
  title_404 = "Page Not Found :("
  omit_categories = false

  # Sidebar settings
  sidebar_about_description = "Software Developer, Rustacean, Open Source Enthusiast"
  sidebar_avatar = "img/me.jpg"

  featured_tags = true
  featured_condition_size = 1
  
  about_me = true

  [params.social]
    rss = true
    email = "yusuke.kominami@gmail.com"
    github = "https://github.com/komi1230"
    facebook = "https://www.facebook.com/1230komi/"
    linkedin = "https://www.linkedin.com/in/yusuke-kominami-0419b1157/"

  [[params.addtional_menus]]
    title =  "ABOUT"
    href =  "/top/about/"

[markup]
  [markup.tableOfContents]
    endLevel = 2
    startLevel = 1
  [markup.highlight]
    style = "dracula"
```

## Deploy with GitHub Actions

Next, do you want deploy this site and share it with others?
OK, let's do it.

At first, push your site to your repository.

```bash
$ git init
$ git add .
$ git commit -m "initialized"
$ git remote add origin https://github.com/{YourGitHubAccountID}/{RepositoryName}
$ git push -u origin master
```

Next, setup GitHub Actions.
To do this, we have 2 ways.

- Add .yaml file locally and push it to your repository
- Add .yaml file in GitHub site

Difference between these is whether the interface in adding .yaml file is CUI or GUI.
Here we will do it by CUI.

Make directory named `.github/workflows/` and .yaml file.

```bash
$ mkdir -p .github/workflows
$ touch .github/workflows/gh-pages.yml
```

GitHub Actions runs with `.github/workflows/gh-pages.yml`, so this is needed.

Content of this .yaml file should be like this:

```yaml
name: GitHub Pages

# Controls when the action will run. Triggers the workflow on push or pull request
# events but only for the master branch
on:
  push:
    branches:
      - master

# A workflow run is made up of one or more jobs that can run sequentially or in parallel
jobs:
  deploy:
    # The type of runner that the job will run on
    runs-on: ubuntu-latest

    # Steps represent a sequence of tasks that will be executed as part of the job
    steps:
      # Checks-out your repository under $GITHUB_WORKSPACE, so your job can access it
      - uses: actions/checkout@v2
        with:
          submodules: true  # Fetch Hugo themes
          fetch-depth: 0 

      - name: Setup Hugo
        uses: peaceiris/actions-hugo@v2
        with:
          hugo-version: '0.74.3'

      - name: Build
        run: hugo --minify
      
      - name: Deploy
        uses: peaceiris/actions-gh-pages@v3
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          publish_dir: ./public
```

Here I don't explain this, but this config make GitHub Actions deploy your site.

OK push this to your repository.
Then, GitHub Actions is running or have run in your repository.
There is a green check mark.

### Setting config in repository

So far, almost all jobs are done.
Finally, we will share your site with others.

See `Settings` page in your repository.
In the middle of the page, you can see `GitHub Pages` group.
This setting handles which directory to deploy.

Here, set source branch to `gh-pages` and the directory to `/(root)`.

Congratulations!
You've done all jobs!

Check `https://{YourGitHubAccoutID}.github.io/{RepositoryName}`.
Your site has been deployed.

# Links

- [Hugo](https://gohugo.io/)
- [Hugo themes](https://themes.gohugo.io/)
- [My site repository](https://github.com/komi1230/portfolio)
- [Sample config](https://github.com/zhaohuabing/hugo-theme-cleanwhite/blob/master/exampleSite/config.toml)