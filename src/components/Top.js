import React, { useEffect, useState } from 'react'
import "../index.css"


const scrollTop = () => {
  return Math.max(
    window.pageYOffset, 
    document.documentElement.scrollTop, 
    document.body.scrollTop
  );
};

export const NavBar = () => {
  const [colorGradient, setColorGradient] = useState(0);

  const onScroll = () => {
    const position = scrollTop();
    console.log(position)
    if (position >= 450) {
      setColorGradient(1);
    } else {
      setColorGradient(position/450);
    }
  };

  useEffect(() => {
    document.addEventListener("scroll", onScroll);
    return () => document.removeEventListener("scroll", onScroll);
  });

  const colorR = String(126 - 76 * colorGradient);
  const colorG = String(123 - 73 * colorGradient);
  const colorB = String(215 - 165 * colorGradient);
  const colorA = String(0.2 + 0.8 * colorGradient);
  const  scrollStyle = {
    backgroundColor: "rgba(" + colorR + "," + colorG + "," + colorB + "," + colorA + ")"
  }

  return (
    <header style={scrollStyle}>
      <ul class="topnav">
        <li><a href="#home">Home</a></li>
        <li><a href="#about">About</a></li>
        <li><a href="#skills">Skills</a></li>
        <li><a href="#works">Works</a></li>
      </ul>
    </header>
  );
};


export default function Top() {
    return (
        <div id="topview" >
            
            <NavBar/>
            <br/><br/><br/><br/><br/><br/><br/><br/><br/>
            <br/><br/><br/><br/><br/><br/><br/><br/><br/>
            <br/><br/><br/><br/><br/><br/><br/><br/><br/>
            <br/><br/><br/><br/><br/><br/><br/><br/><br/>
            <br/><br/><br/><br/><br/><br/><br/><br/><br/>
            <br/><br/><br/><br/><br/><br/><br/><br/><br/>
            <br/><br/><br/><br/><br/><br/><br/><br/><br/>
            <br/><br/><br/><br/><br/><br/><br/><br/><br/>
            <br/><br/><br/><br/><br/><br/><br/><br/><br/>
            <br/><br/><br/><br/><br/><br/><br/><br/><br/>
            hogehogeho
        </div>
    )
}