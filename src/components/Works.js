import React from 'react'
import { makeStyles } from '@material-ui/core/styles'
import Grid from '@material-ui/core/Grid'


const useStyles = makeStyles(theme => ({
    worksTitle: {
        marginTop: '50px',
        textAlign: "center",
    },
    worksListTitle: {
        marginTop: '50px',
        padding: "0 10px",
        textAlign: "center",
    },
    worksListDescription: {
        marginTop: '50px',
        padding: "0 10px",
        lineHeight: '25px',
    },
}))


export default function Works() {
    const classes = useStyles()
    return (
        <Grid
            container
            direction="column"
            justify="center"
        >
            <Grid item>
                <h1 className={classes.worksTitle} >Works</h1>
            </Grid>
            <Grid container>
                <Grid
                    container
                    direction="row"
                    justify="center"
                >
                    <Grid item container xs={4} md={3}>
                        <a href="https://github.com/komi1230/portfolio" className={classes.worksListTitle}>
                            Portfolio
                        </a>
                    </Grid>
                    <Grid item container xs={8} md={6}>
                        <div className={classes.worksListDescription}>
                            This site. 
                            <br/>
                            This is written with React and Material-UI and hosted with GitHub Pages.
                        </div>
                    </Grid>
                </Grid>
            </Grid>
            <Grid container>
                <Grid
                    container
                    direction="row"
                    justify="center"
                >
                    <Grid item container xs={4} md={3}>
                        <a 
                            href="https://github.com/komi1230/article_classifier" 
                            className={classes.worksListTitle}
                        >
                            Article Classifier
                        </a>
                    </Grid>
                    <Grid item container xs={8} md={6}>
                        <div className={classes.worksListDescription}>
                            A document classifier with a document to a category, focused on Gunosy.
                            <br/>
                            This classification algorithm is simple Naive Bayes.
                            <br/><br/>
                            The language is Python. And I used Django as a web framework. 
                            <br/>
                            I made everything from scraping engine, naive bayes algorithm to front end.
                        </div>
                    </Grid>
                </Grid>
            </Grid>
            <Grid container>
                <Grid
                    container
                    direction="row"
                    justify="center"
                >
                    <Grid item container xs={4} md={3}>
                        <a 
                            href="https://github.com/komi1230/Resume/tree/master/book_reinforcement" 
                            className={classes.worksListTitle}
                        >
                            Reinforcement Book
                        </a>
                    </Grid>
                    <Grid item container xs={8} md={6}>
                        <div className={classes.worksListDescription}>
                            A book on an introduction to reinforcement learning.
                            <br/>
                            This book starts from fundamental mathematics and finally concludes in latest algorithms of deep reinforcement learning.
                            <br/><br/>
                            I wrote this book with the knowledge while I was a researcher in Hitachi.
                            <br/>
                            (Attension: this is written in Japanese)
                        </div>
                    </Grid>
                </Grid>
            </Grid>
        </Grid>
    )
}