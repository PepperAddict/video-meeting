import React, { useState, useEffect, useRef } from 'react'
import { useMutation, useSubscription } from '@apollo/client'
import { useSelector, useDispatch } from 'react-redux';
import { SEND_MESSAGE, SUB_MESSAGE } from '../../helper/gql.js'


const Messages = ({ user, room }) => {
    
    const { data, error } = useSubscription(SUB_MESSAGE, {variables: {room: room.id}})
    const mainChat = useRef()

    const scrollToBottom = () => {
        mainChat.current.scrollIntoView({behavior: 'smooth'})
    }

    useEffect(() => {
        scrollToBottom()
    }, [data])

    if (error) console.log(error)

    return (
        <>
            {data ? data.message.map((data, key) => {

                return <div key={key}><span className="user">{data.user}</span>: <div className="content">{data.content}</div></div>
            }) :
                'no messages'
                }
        <p className="hide-me" ref={mainChat}>bottom</p>
        </>
    )

}

const Chat = ({ user}) => {
    const room = useSelector(state => state.room.value)
    const [text, setText] = useState('')
    const [postMessage] = useMutation(SEND_MESSAGE)
    const chatText = useRef()


    const sendMessage = (e) => {
        e.preventDefault()
        console.log(text)
        if (text.length > 0) {
            console.log('sending')
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
        <div className="chat-container">

        <div className="chat-section" >
            <Messages user={user} room={room} />
            
        </div> 
                   <form onSubmit={(e) => sendMessage(e)} >
                <input placeholder="send a message" onChange={(e) => setText(e.target.value)} ref={chatText}/>
                <button className="right-button" type="submit">Send</button>
            </form>
</div>
    )
}

export default Chat