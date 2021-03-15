import React , {useEffect} from 'react';
import QuickEntry from './quickEntry'
import SigninEntry from './SigninEntry'
import '../../styles/main_page.styl'

export default function Welcome() {


  return (
    <div className="container">
        <QuickEntry />
        {/* <SigninEntry /> */}

    </div>
  );
}
