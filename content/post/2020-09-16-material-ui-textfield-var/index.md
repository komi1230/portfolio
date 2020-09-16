---
layout:      post
title:       "How to get data from Textfield of Material-UI"
subtitle:    "From UI to data processing in front end"
description: "Material-UI is a very good package to construct UI easily in React. This article provides how to get data from input form."
date:        2020-09-16
author:      "Yusuke Kominami"
image:       "https://res.cloudinary.com/wnotw/images/c_limit,w_1536,q_auto:best,f_auto/v1524534818/kzsbusmeocfs20efvrh1/google-material-design-awards-2017"
tags:        ["React"]
categories:  ["Tech"]
---

# Process input data in front end

Material-UI is reallly convenient package for non-designer because programmer can easily make awesome design.
And Material-UI has a variety of components, which are easy-to-custommize.

![image](https://reactjsexample.com/content/images/2019/06/Brainalytica.jpg)

To get data from user's input, in normal HTML, we use `<input>` tag.
But we have to store data into some variable to process data with JavaScript.

# In practice

You can easily make simple page with Textfield.

```jsx
import React from 'react';
import TextField from '@material-ui/core/TextField';

export default function OurForm() {
  return (
    <TextField label="Label" />
  );
}
```

And UI is like this.

![image](https://lh3.googleusercontent.com/mLnX9CYF6UzrhCNlveRVf6AOmvOUjhWWm6d1ZJxcwkjnyTbXf-NjTp9IlBbT0nyiEsMwfGxqj4lRKGoWYiiLtBUNwvMkOPeqzRCWfYI=w1064-v0)

With this, We can accept user input.
But we cannnot process data, for example `console.log(data)`.

OK, we will do it.
All we have to do is use `useState`.

```jsx
import React from 'react';
import TextField from '@material-ui/core/TextField';

export default function OurForm() {
  const [data, setData] = React.useState("");
  
  const handleSetData = (event) => {
    setData(event.target.value);
  }
  
  return (
    <TextField
      label="Label" 
      value={data}
      onChange={handlleSetData}
    />
  );
}
```

In pure React, it's very difficult to manage components' states.
We can do it by using `Redux`, but `useState` is easier way to controll states.

Here we already controll users' input data.
