import React from 'react'
import { makeStyles } from '@material-ui/core/styles';
import Grid from '@material-ui/core/Grid';


const useStyles = makeStyles(theme => ({
    historyTitle: {
        textAlign: 'center',
    },
}));

export default function History() {
    const classes = useStyles()
    return (
        <>
            <h1 className={classes.historyTitle}>History</h1>
        </>
    )
}