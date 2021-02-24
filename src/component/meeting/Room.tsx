import React, { useState, useEffect, useRef, Fragment } from 'react';
import '../../styles/room.styl';
import Videos from './meeting'
import Chat from './Chat'


export default function Room(props) {


  return (
    <div className="welcome-container">
        <Fragment>
          <Videos />
          <Chat />
        </Fragment>

    </div>
  );
}
