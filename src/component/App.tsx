import 'core-js/stable'
import 'regenerator-runtime/runtime'
import React from 'react';
import ReactDOM from 'react-dom';

import { BrowserRouter as Router, Route } from 'react-router-dom';


//redux portion
import store from './store'
import { Provider } from 'react-redux'

//apollo/graphql portion
import { ApolloClient, InMemoryCache, ApolloProvider } from '@apollo/client';
import { WebSocketLink } from '@apollo/client/link/ws';
const link = new WebSocketLink({
  uri: `ws://localhost:3000/subscriptions`,
  options: {
    reconnect: true
  }
})

const client = new ApolloClient({
  link,
  uri: 'http://localhost:8080/graphql',
  cache: new InMemoryCache({
    typePolicies: {
      Subscription: {
        fields: {
          message: {
            //we need to deal with how the new information coming in with the old
            //since the data doesn't have a proper id setup. This is the quick fix. 
            merge(existing = [], incoming: any) {
              return {...existing, ...incoming}
            }
          }
        }
      },
    },
  })
})

// import components
import Welcome from './homepage/Welcome'
import Room from './meeting/Room'

const App = () => {
  return (
    <Provider store={store}>
      <ApolloProvider client={client}>
        <Router>
          
          <Route exact path="/">
            <Welcome />
          </Route>
          
          <Route path="/room/:room">
            <Room />
          </Route>

        </Router>
      </ApolloProvider>
    </Provider>
  )
}

ReactDOM.render(
  <App />,
  document.getElementById('app')
);

