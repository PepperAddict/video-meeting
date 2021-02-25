import React, { useRef, useEffect, useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { useSelector, useDispatch } from 'react-redux';
import { setName, setRoom } from '../states.js';
import { Redirect } from 'react-router-dom'


export default function QuickEntry(props) {
    const newName = useRef()
    const newRoom = useRef()
    const dispatch = useDispatch()

    const [ready, setReady] = useState(false)

    const user = useSelector(state => state.user.value)
    const room = useSelector(state => state.room.value)

    const setItems = async (e) => {
        e.preventDefault()
        await dispatch(setName(newName.current.value))

        let roomInfo = {
            id: uuidv4(),
            name: newRoom.current.value
        }

        await dispatch(setRoom(roomInfo))

        newName.current.value = ""
        newRoom.current.value = ""

        setReady(true)

    }
    if (ready) {
        return <Redirect to={"/room/" + room.id}/>
    }
    return (
        <div className="left-container">
            <h2> Quickly Join </h2>

                <form onSubmit={(e) => setItems(e)}>
                    <input placeholder="enter a display name" ref={newName} />
                    <input placeholder="enter room ID" ref={newRoom} />
                    <button type="submit">Submit</button>
                </form> 

        </div>
    )
}
