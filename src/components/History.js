import React from 'react'
import { makeStyles } from '@material-ui/core/styles'
import Grid from '@material-ui/core/Grid'
import softbank from './images/softbank.gif'
import aiful from './images/aiful.png'
import flywheel from './images/flywheel.png'
import line from './images/line.jpg'
import hitachi from './images/hitachi.png'
import kyotouniv from './images/kyotouniv.png'
import epfl from './images/epfl.png'


const useStyles = makeStyles(theme => ({
    historyTitle: {
        marginTop: '50px', 
        textAlign: 'center',
    },
    historySubTitle: {
        marginTop: '30px',
        marginBottom: '50px',
        paddingLeft: '10%',
        textAlign: 'left',
    },
    historyImg: {
        margin: '0 auto',
        padding: '0 30px',
        textAlign: "center",
    },
    historyDescription: {
        padding: '0 30px',
    }
}));


export default function History() {
    const classes = useStyles()
    return (
        <Grid
            container
            direction="column"
            justify="center"
        >
            <Grid item>
                <h1 className={classes.historyTitle}>History</h1>
            </Grid>
            <Grid item container>
                <Grid 
                    container
                    direction="column"
                    justify="center"
                >
                    <Grid item>
                        <h2 className={classes.historySubTitle}>Experience</h2>
                    </Grid>
                    <Grid container>
                        <Grid
                            container
                            direction="row"
                            justify="center"
                        >
                            <Grid item xs={4} md={3}>
                                <img src={softbank} className={classes.historyImg} width="50%" alt="SoftBank" />
                            </Grid>
                            <Grid item xs={8} md={6}>
                                <div className={classes.historyDescription}>
                                    <h3>SoftBank</h3>
                                    <h4>Machine Learning Engineer</h4>
                                    <p>April/1st/2020 -</p>
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
                            <Grid item xs={4} md={3}>
                                <img src={aiful} className={classes.historyImg} width="50%" alt="Aiful" />
                            </Grid>
                            <Grid item xs={8} md={6}>
                                <div className={classes.historyDescription}>
                                    <h3>Aiful</h3>
                                    <h4>Technical Advisor</h4>
                                    <p>April/1st/2020 -</p>
                                    <h4>Software Engineer and Project Manager</h4>
                                    <p>June/1st/2019 - March/9th/2020</p>
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
                            <Grid item xs={4} md={3}>
                                <img src={flywheel} className={classes.historyImg} width="50%" alt="FlyWheel" />
                            </Grid>
                            <Grid item xs={8} md={6}>
                                <div className={classes.historyDescription}>
                                    <h3>Flywheel</h3>
                                    <h4>Data Scientist and Machine Learning Engineer</h4>
                                    <p>August/15th/2019 - September/28th/2019</p>
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
                            <Grid item xs={4} md={3}>
                                <img src={line} className={classes.historyImg} width="50%" alt="line" />
                            </Grid>
                            <Grid item xs={8} md={6}>
                                <div className={classes.historyDescription}>
                                    <h3>LINE Corp</h3>
                                    <h4>Software Engineer Intern</h4>
                                    <p>August/23rd/2019 - August/30th/2019</p>
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
                            <Grid item xs={4} md={3}>
                                <img src={hitachi} className={classes.historyImg} width="50%" alt="Hitachi" />
                            </Grid>
                            <Grid item xs={8} md={6}>
                                <div className={classes.historyDescription}>
                                    <h3>Hitachi Research Lab.</h3>
                                    <h4>Machine Learning Researcher</h4>
                                    <p>May/1st/2017 - June/30th/2018</p>
                                </div>
                            </Grid>
                        </Grid>
                    </Grid>
                </Grid>
            </Grid>
            <Grid item container>
                <Grid 
                    item
                    container
                    direction="column"
                    justify="center"
                >
                    <Grid item>
                        <h2 className={classes.historySubTitle}>Education</h2>
                    </Grid>
                    <Grid item container>
                        <Grid
                            item
                            container
                            direction="row"
                            justify="center"
                        >
                            <Grid item xs={4} md={3}>
                                <img src={kyotouniv} className={classes.historyImg} width="50%" alt="Kyoto Univ." />
                            </Grid>
                            <Grid item xs={8} md={6}>
                                <div className={classes.historyDescription}>
                                    <h3>Kyoto University - faculty of Science</h3>
                                    <h4>Majoring in Biology at Takada Lab.</h4>
                                    <p>April/1st/2016 - March/31st/2020</p>
                                </div>
                            </Grid>
                        </Grid>
                    </Grid>
                    <Grid item container>
                        <Grid
                            item
                            container
                            direction="row"
                            justify="center"
                        >
                            <Grid item xs={4} md={3}>
                                <img src={epfl} className={classes.historyImg} width="50%" alt="EPFL" />
                            </Grid>
                            <Grid item xs={8} md={6}>
                                <div className={classes.historyDescription}>
                                    <h3>EPFL - faculty of Computer Science</h3>
                                    <h4>Exchange Student</h4>
                                    <p>April/1st/2016 - March/31st/2020</p>
                                </div>
                            </Grid>
                        </Grid>
                    </Grid>
                </Grid>
            </Grid>
        </Grid>
    )
}