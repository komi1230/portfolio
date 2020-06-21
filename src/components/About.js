import React from 'react'
import { makeStyles } from '@material-ui/core/styles';
import Grid from '@material-ui/core/Grid';
import meImg from "./images/me.jpg"
import "../index.css"


const useStyles = makeStyles(theme => ({
    aboutTitle: {
        marginTop: '50px',
        textAlign: 'center',
    },
    aboutPhoto: {
        textAlign: 'center',
    },
    aboutTitles: {
        textAlign: 'center',
        padding: '10px',
        lineHeight: '25px'
    },
    aboutIntro: {
        textAlign: 'left',
        padding: '20px',
        lineHeight: '25px'
    }
}));

export default function About() {
    const classes = useStyles()
    return (
        <Grid
            container
            direction="column"
            justify="center"
            spacing={6}
        >
            <Grid xs={12} item>
                <h1 className={classes.aboutTitle} id="about">About</h1>
            </Grid>
            <Grid xs={12} item>
                <Grid
                    container
                    direction="row"
                    justify="center"
                    spacing={2}
                >
                    <Grid sm={5}>
                        <Grid
                            container
                            direction="column"
                            justify="center"
                        >
                            <Grid xs={12} item>
                                <div className={classes.aboutPhoto}>
                                    <img src={meImg} width="70%" alt="me" />
                                </div>
                            </Grid>
                            <Grid xs={12} item>
                                <div className={classes.aboutTitles}>
                                    <li style={{ listStyleType: "none", paddingBottom: "5px" }}>
                                        Machine Learning Engineer
                                    </li>
                                    <li style={{ listStyleType: "none" }}>
                                        Technical Adviser
                                    </li>
                                    <div id="social-icon" style={{ paddingTop: "20px" }}>
                                        <a href="https://github.com/komi1230">
                                            <i class="fa fa-github fa-2x"></i>
                                        </a>
                                        <a href="https://www.linkedin.com/in/yusuke-kominami-0419b1157/">
                                            <i style={{ paddingLeft: "30px" }} class="fa fa-linkedin fa-2x"></i>
                                        </a>
                                        <a href="https://twitter.com/komi_edtr_1230">
                                            <i style={{ paddingLeft: "30px" }} class="fa fa-twitter fa-2x"></i>
                                        </a>
                                        <a href="https://www.facebook.com/1230komi">
                                            <i style={{ paddingLeft: "30px" }} class="fa fa-facebook-f fa-2x"></i>
                                        </a>
                                        <a href="https://komi.hatenadiary.com/">
                                            <i style={{ paddingLeft: "30px" }} class="fa fa-pencil fa-2x"></i>
                                        </a>
                                    </div>
                                </div>
                            </Grid>
                        </Grid>
                    </Grid>
                    <Grid sm={7} item>
                        <div className={classes.aboutIntro}>
                            My name is Yusuke Kominami.
                            <br /><br />
                            I'm 23 years old and living in Tokyo.
                            <br />
                            And I work at SoftBank as a machine learning engineer and at Aiful as a technical adviser.
                            <br /><br />
                            I graduated from the faculty of Science in Kyoto University, majored Biology at <a href="http://theory.biophys.kyoto-u.ac.jp/">Takada Lab</a>.
                            <br /><br />
                            About software engineering, I love Lisp (especially Common Lisp). It is a perfect programming language, I think.
                            <br />
                            My expertise ranges from HTML/CSS/JavaScript to Low-level programming.
                            Furthermore, I have solid knowledge on machine learning and data science based on mathematics.
                            <br /><br />
                            Outside of computer, I love watching documentary movies and working out.
                            <br /><br />
                            You can find me on <a href="https://twitter.com/komi_edtr_1230">Twitter</a>.
                            <br /><br />
                            And I often write articles in <a href="https://komi.hatenadiary.com/">Hatena Blog</a>.
                        </div>
                    </Grid>
                </Grid>
            </Grid>
        </Grid>
    )
}