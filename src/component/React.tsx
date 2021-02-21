import { hot } from 'react-hot-loader/root';
import React from 'react';
import { BrowserRouter as Router, Route } from 'react-router-dom';
import {ApolloClient, InMemoryCache, ApolloProvider} from '@apollo/client';

const client = new ApolloClient({
    uri: 'http://localhost:8080/graphql',
    cache: new InMemoryCache()
})

// components
import Welcome from './Welcome'
import Room from './meeting/Room'

const App = () => {
  return (
    <ApolloProvider client={client}>


    <Router> 

    <Route exact path="/">
      <Welcome />
    </Route>
    <Route path="/room">
      <Room />
    </Route>

</Router>
    </ApolloProvider>

  )
}


export default hot(App)