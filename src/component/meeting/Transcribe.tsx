import React, { useState, useEffect, useRef } from 'react'
import { useMutation, useSubscription } from '@apollo/client'
import { useSelector, useDispatch } from 'react-redux';
import { SEND_TRAN, SUB_TRAN } from '../../helper/gql.js'

const Messages = ({ user }) => {
    const room = useSelector(state => state.room.value)
    console.log(room)
    const { data, error } = useSubscription(SUB_TRAN, {variables: {room: room.id}})

    if (error) console.log(error)
    return (
        <>
            {data ? data.message.map((data, key) => {

                return <p key={key}>{data.user} {data.content}</p>
            }) :
                'no messages'
                }
        </>
    )

}

const Transcribe = ({ user }) => {
    const mainChat = useRef()

    const scrollToBottom = () => {
        mainChat.current.scrollIntoView({behavior: 'smooth'})
    }


    return (
        <>
        <div className="chat-section" >
            <Messages user={user} />
            <p ref={mainChat}>bottom</p>
        </div> 
</>
    )
}

export default Transcribe