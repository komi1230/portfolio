import React from 'react'
import { makeStyles } from '@material-ui/core/styles'
import AppBar from '@material-ui/core/AppBar';
import Toolbar from '@material-ui/core/Toolbar';
import Typography from '@material-ui/core/Typography';
import "../index.css"


const useStyles = makeStyles(theme => ({
  root: {
    flexGrow: 1,
  },
  AppBarColor: {
    backgroundColor: '#606060',
  },
  menuButton: {
    marginRight: theme.spacing(2),
  },
  title: {
    flexGrow: 0.05,
  },
}));


function Header() {
    const classes = useStyles();
  
    return (
      <div className={classes.root}>
        <AppBar position="static" classes={{colorPrimary: classes.AppBarColor}}>
          <Toolbar>
            <Typography variant="h6" className={classes.title}>
              Home
            </Typography>
            <Typography variant="h6" className={classes.title}>
              About
            </Typography>
            <Typography variant="h6" className={classes.title}>
              Biography
            </Typography>
          </Toolbar>
        </AppBar>
      </div>
    );
  }


export default function Top() {
    return (
        <div id="topview">
            <Header/>
            hogehoge
        </div>
    )
}