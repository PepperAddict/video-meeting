import React, { useState, useEffect, useRef, Fragment } from 'react';
import '../../styles/room.styl';
import Videos from './meeting'
import Chat from './Chat'

import { useSelector, useDispatch } from 'react-redux';
import { setName } from '../states.js';

export default function Room(props) {
  const user = useSelector(state => state.user.value)
  const dispatch = useDispatch()
  const newName = useRef()

  const changeName = (e) => {
    e.preventDefault()
    dispatch(setName(newName.current.value))
    newName.current.value = ""
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
