import { hot } from 'react-hot-loader/root';
import React from 'react';
import { BrowserRouter as Router, Route } from 'react-router-dom';


// components
import Welcome from './Welcome'
import Room from './meeting/Room'

const App = () => {
  return (
    <Router> 

    <Route exact path="/">
      <Welcome />
    </Route>
    <Route path="/room">
      <Room />
    </Route>

</Router>
  )
}


export default hot(App)