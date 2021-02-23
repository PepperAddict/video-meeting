import { hot } from 'react-hot-loader/root';
import React from 'react';
import { BrowserRouter as Router, Route } from 'react-router-dom';
import { ApolloClient, InMemoryCache, ApolloProvider } from '@apollo/client';
import { WebSocketLink } from '@apollo/client/link/ws';

import store from './store'
import { Provider } from 'react-redux'


const link = new WebSocketLink({
  uri: `ws://localhost:3000/subscriptions`,
  options: {
    reconnect: true
  }
})
const cache = {
  host: process.env.REDIS_HOST,
  password: process.env.REDIS_PASS
}
const client = new ApolloClient({
  link,
  uri: 'http://localhost:8080/graphql',

  // defaultOptions: {
  //   watchQuery: {
  //     fetchPolicy: 'no-cache',
  //     errorPolicy: 'ignore'
  //   },
  //   query: {
  //     fetchPolicy: 'no-cache',
  //     errorPolicy: 'ignore'
  //   }
  // },
  cache: new InMemoryCache({
    typePolicies: {
      Subscription: {

        fields: {
          message: {
            merge(existing = [], incoming: any) {

              return {...existing, ...incoming}
            }
          }
        }
      },
    },

  })

})

// components
import Welcome from './Welcome'
import Room from './meeting/Room'
import { mergeNamedTypeArray } from 'graphql-tools';

const App = () => {
  return (
    <Provider store={store}>


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
    </Provider>
  )
}


export default hot(App)