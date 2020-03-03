import React, { useEffect, useState } from 'react'
import "../index.css"


const NavBar = () => {
  const scrollTop = () => {
    return Math.max(
      window.pageYOffset, 
      document.documentElement.scrollTop, 
      document.body.scrollTop
    );
  };

  const [colorGradient, setColorGradient] = useState(0);

  const onScroll = () => {
    const position = scrollTop();
    const threshold = 200;
    if (position >= threshold) {
      setColorGradient(1);
    } else {
      setColorGradient(position/threshold);
    }
  };

  useEffect(() => {
    document.addEventListener("scroll", onScroll);
    return () => document.removeEventListener("scroll", onScroll);
  });

  const colorR = String(126 - 100 * colorGradient);
  const colorG = String(123 - 92 * colorGradient);
  const colorB = String(215 - 100 * colorGradient);
  const colorA = String(0.2 + 0.8 * colorGradient);
  const  scrollStyle = {
    backgroundColor: "rgba(" + colorR + "," + colorG + "," + colorB + "," + colorA + ")"
  }

  return (
    <header style={scrollStyle}>
      <ul className="topnav">
        <li><a href="#home">Home</a></li>
        <li><a href="#about">About</a></li>
        <li><a href="#skills">Skills</a></li>
        <li><a href="#works">Works</a></li>
      </ul>
    </header>
  );
};

const TopCard = () => {
  return (
    <section className="card-parent">
      <div className="card-child">
        <div className="elseTop">
          Machine Learning and Lisp Engineer
        </div>
        <div className="title">
          Yusuke Kominami
        </div>
        <div className="elseBottom">
          Last Updated: March/03/2020
        </div>
      </div>
    </section>
  )
}

export default function Top() {
    return (
        <div id="topview" >
            <NavBar/>
            <TopCard/>
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