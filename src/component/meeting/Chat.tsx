import React, { useState, useRef } from 'react'
import { useMutation, useSubscription } from '@apollo/client'
import { SEND_MESSAGE, SUB_MESSAGE } from '../../helper/gql.js'
import { useSelector, useDispatch } from 'react-redux';

const Messages = ({ user, room }) => {

    const { data, error } = useSubscription(SUB_MESSAGE, { variables: { room: room.id } })
    if (error) {
        console.log(error)
    }
    return (
        <>
            {data && data.message ? data.message.map((data, key) => {

                return <p key={key}>{data.user} {data.content}</p>
            }) : 'no messages'}
        </>
    )

}

const Chat = (props) => {
    const [text, setText] = useState('')
    const [postMessage] = useMutation(SEND_MESSAGE)
    const chatText = useRef()
    const room = useSelector(state => state.room.value)
    const user = useSelector(state => state.user.value)




    const sendMessage = (e) => {
        e.preventDefault()

        if (text.length > 0) {
            postMessage({
                variables: {
                    room: room.id,
                    user,
                    content: text
                }
            })
        }

        //once sent, then clear the state
        setText('')
        chatText.current.value = ''
    }

    return (
        <div>
            <Messages user={user} room={room} />
            <form onSubmit={(e) => sendMessage(e)}>
                <input placeholder="send a message" onChange={(e) => setText(e.target.value)} ref={chatText} />
                <button type="submit">Submit</button>
            </form>
        </div>
    )
}

export default Chat