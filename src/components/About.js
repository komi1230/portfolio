import React from 'react'
import { makeStyles } from '@material-ui/core/styles';
import Grid from '@material-ui/core/Grid';
import "../index.css"


const useStyles = makeStyles(theme => ({
    aboutTitle: {
        textAlign: 'center',
        margin: '5% auto'
    },
}));

export default function About() {
    const classes = useStyles()
    return (
        <Grid
            container
            direction="column"
            justify="center"
            spacing={2}
        >
            <Grid xs={12}>
                <h1 className={classes.aboutTitle}>About</h1>
            </Grid>
            <Grid>
                hogehoge
            </Grid>
        </Grid>
    )
}