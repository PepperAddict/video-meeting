import React, {useRef, useState} from 'react'
import {SET_ROOM } from '../../helper/gql.js'
import { useMutation} from '@apollo/client'
import {randomString} from '../../helper/configs'
import { useDispatch } from 'react-redux';
import { setRoom } from '../states.js';

export default function CreateRoom(props) {
    const roomName = useRef();
    const dispatch = useDispatch()

    const [gqlSetROOM] = useMutation(SET_ROOM)

    const createRoom = async (e) => {
        e.preventDefault()
        let id = randomString(16, '#aA')

        let roomInfo = {
            id: id,
            name: roomName.current.value
        }
        console.log(roomInfo)

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