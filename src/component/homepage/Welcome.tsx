import React , {useEffect} from 'react';
import QuickEntry from './quickEntry'
import SigninEntry from './SigninEntry'


export default function Welcome() {


  return (
    <div className="welcome-container">
      <div className="main-container">
        <h1>Welcome to Video Meet</h1>

        <QuickEntry />

        <SigninEntry />

      </div>
    </div>
  );
}
