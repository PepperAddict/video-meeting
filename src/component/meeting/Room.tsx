import React, { Fragment, useRef } from 'react';
import '../../styles/room.styl';
import Videos from './Videos'
import Chat from './Chat'

import { Redirect } from 'react-router-dom'
import { useSelector, useDispatch } from 'react-redux';
import { setName } from '../states.js';

export default function Room(props) {
  const user = useSelector(state => state.user.value)
  const room = useSelector(state => state.room.value)
  const dispatch = useDispatch()
  const newName = useRef()

  const changeName = (e) => {
    e.preventDefault()
    dispatch(setName(newName.current.value))
    newName.current.value = ""
  }

  if (!user && !room) {
    return <Redirect to="/" />
  }
  return (
    <div className="welcome-container">

      {user ? (

        <Fragment>
          <Videos user={user} />
          <Chat user={user} />
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

