import React, { Fragment } from 'react';
import '../../styles/room.styl';
import Videos from './meeting'
import Chat from './Chat'
import { useSelector } from 'react-redux';
import { Redirect } from 'react-router-dom'

export default function Room(props) {
  const user = useSelector(state => state.user.value)
  const room = useSelector(state => state.room.value)


  if (user && room) {
    return (
      <div className="welcome-container">
        <Fragment>
          <Videos user={user} room={room} />
          <Chat user={user} room={room} />
        </Fragment>

      </div>
    );
  } else {
    return <Redirect to="/" />
  }

}
