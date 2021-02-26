import React, {useRef, useState} from 'react'
import {SET_ROOM } from '../../helper/gql.js'
import { useMutation} from '@apollo/client'
import { v4 as uuidv4 } from 'uuid';
import { useDispatch } from 'react-redux';
import { setRoom } from '../states.js';

export default function CreateRoom(props) {
    const roomName = useRef();
    const dispatch = useDispatch()

    const [gqlSetROOM] = useMutation(SET_ROOM)

    const createRoom = async (e) => {
        e.preventDefault()

        let roomInfo = {
            id: 'kitty',
            name: roomName.current.value
        }

        //set as a global state 
        await dispatch(setRoom(roomInfo))

        //and let's also put it in the database 
        gqlSetROOM({variables: roomInfo}).then((res) => {
            if (res.data.setRoom) {
                props.setReady(3)
            }
        })

    }

    return (
        <div>
            <p>The room doesn't exist. Would you like to create one?</p>

            <form onSubmit={(e) => createRoom(e)}>
                <input name="room" placeholder="pick a name" ref={roomName}/>
                <button type="submit">Create</button>
            </form>

        </div>
    )
}