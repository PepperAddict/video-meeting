import 'core-js/stable'
import 'regenerator-runtime/runtime'
import React from 'react';
import ReactDOM from 'react-dom';

import App from './React'



ReactDOM.render(
  <App />,
  document.getElementById('app')
);

// if ((module as any).hot){
//   (module as any).hot.accept('./React', App)
// }