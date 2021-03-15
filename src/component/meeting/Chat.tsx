import React, { useState, useEffect, useRef } from 'react'
import { useMutation, useSubscription } from '@apollo/client'
import { useSelector, useDispatch } from 'react-redux';
import { SEND_MESSAGE, SUB_MESSAGE } from '../../helper/gql.js'
import Room from './Room.js';

const Messages = ({ user, room }) => {
    
    const { data } = useSubscription(SUB_MESSAGE, {variables: {room: room.id}})
    if (data) console.log(data)

    return (
        <>
        <p>Hello</p>
            {/* {data ? data.message.map((data, key) => {

                return <p key={key}>{data.user} {data.content}</p>
            }) :
                'no messages'
                } */}
        </>
    )

}

const Chat = ({ user }) => {
    const room = useSelector(state => state.room.value)
    const [text, setText] = useState('')
    const [postMessage] = useMutation(SEND_MESSAGE)
    const chatText = useRef()
    const mainChat = useRef()

    const scrollToBottom = () => {
        mainChat.current.scrollIntoView({behavior: 'smooth'})
    }

    useEffect(() => {
        scrollToBottom
    }, [text])

    const sendMessage = (e) => {
        e.preventDefault()

        if (text.length >0) {
            postMessage({
                variables: {
                    user, 
                    content: text,
                    room: room.id
                }
            })
        }

        //once sent, then clear the state
        setText('')
        chatText.current.value = ''
    }

    return (
        <>
        <h2>Chat</h2>
        <div className="chat-section" >
            <Messages user={user} room={room} />
            <p ref={mainChat}>bottom</p>
        </div> 
                   <form onSubmit={(e) => sendMessage(e)} >
                <input placeholder="send a message" onChange={(e) => setText(e.target.value)} ref={chatText}/>
                <button type="submit">Submit</button>
            </form>
</>
    )
}

export default Chat