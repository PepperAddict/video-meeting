import React, { Fragment, useRef, useState } from 'react';
import '../../styles/room.styl';
import Videos from './Videos'
import Chat from './Chat'
import Transcribe from './Transcribe'

import { Redirect } from 'react-router-dom'
import { useSelector, useDispatch } from 'react-redux';
import { setName } from '../states.js';

export default function Room(props) {
  const user = useSelector(state => state.user.value)
  const room = useSelector(state => state.room.value)
  const dispatch = useDispatch()
  const newName = useRef()
  const [showChat, setChat] = useState(true)

  const changeName = (e) => {
    e.preventDefault()
    dispatch(setName(newName.current.value))
    newName.current.value = ""
  }

  if (!user && !room) {
    return <Redirect to="/" />
  }
  return (
    <div className="room-container">

      {user ? (

        <Fragment>
          <Videos user={user} />
          <div className="tab-chat">
          <h2 onClick={() => setChat(true)}>Chat</h2>
          <h2 onClick={() => setChat(false)}>Tanscribe</h2>
          </div>

          {showChat ? 
          <Chat user={user} setChat={setChat}/>
          : 
          <Transcribe user={user} setChat={setChat}/>
          }
          
          
        </Fragment>

      ) : (
          <form onSubmit={(e) => changeName(e)}>
            <input placeholder="enter name" ref={newName} />
            <button type="submit">Submit</button>
          </form>
        )}

    </div>
  );
}

