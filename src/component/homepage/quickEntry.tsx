import React, { useRef, useEffect, useState } from 'react';
import { Redirect } from 'react-router-dom'

import { useSelector, useDispatch } from 'react-redux';
import { setName, setRoom } from '../states.js';

import { useLazyQuery } from '@apollo/client'
import { GET_ROOM } from '../../helper/gql.js'

import CreateRoom from './CreateRoom'

export default function QuickEntry(props) {
    const newName = useRef()
    const newRoom = useRef()
    const dispatch = useDispatch()
    const [checkARoom, { data, error }] = useLazyQuery(GET_ROOM)
    const [ready, setReady] = useState(1)

    const room = useSelector(state => state.room.value)

    const setItems = async (e) => {
        e.preventDefault()
        await dispatch(setName(newName.current.value))

        //before we can join a room, we need to 
        //check if it actually exists then 
        //we can create it if the user wants.

        await checkARoom({ variables: { id: newRoom.current.value } })


        newName.current.value = ""
        newRoom.current.value = ""

        // setReady(true)

    }

    useEffect(async () => {
        if (error) {
            console.log(error)
        }
        if (data) {
            if (data.getRoom.id !== 'error-not-found') {
                await dispatch(setRoom({ id: data.getRoom.id, name: data.getRoom.name }))
                setReady(3)
            } else {
                //let's create that room!
                setReady(2)
            }
        }
    }, [data, error])


    if (ready == 3) {
        return <Redirect to={"/room/" + room.id} />
    }
    return (
        <div className="welcome-container">
            <div className="left-container">
            <h1>Welcome to Video Meet</h1>

                        <h2> Quickly Join </h2>
            {ready == 1 ?
                <form onSubmit={(e) => setItems(e)}>
                    <label htmlFor="name">Name</label>
                    <input name="name" id="name" placeholder="enter a display name" ref={newName} />
                    <label htmlFor="room">Join a room</label>

                    <input name="room" id="room" placeholder="enter room ID" ref={newRoom} />
                    <button type="submit" className="right-button" id="join">Join</button>
                </form> : <CreateRoom setReady={setReady} />}
            </div>

        </div>
    )
}
