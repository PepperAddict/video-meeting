import React, { useState, useEffect, useRef } from 'react';
import '../../styles/room.styl';
import Videos from './meeting'
import Chat from './Chat'


export default function Room(props) {
  const [user, setUser] = useState('Linda')



  return (
    <div className="welcome-container">

    <Videos user={user}/>

    <Chat user={user}/>
    </div>
  );

}
