import React, { useState, useEffect, useRef } from 'react'
import { useMutation, useSubscription } from '@apollo/client'

import { SEND_MESSAGE, SUB_MESSAGE } from '../../helper/gql.js'

const Messages = ({ user }) => {
    const { data } = useSubscription(SUB_MESSAGE)

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

const Chat = ({ user }) => {
    const [text, setText] = useState('')
    const [postMessage] = useMutation(SEND_MESSAGE)
    const chatText = useRef()

    const sendMessage = (e) => {
        e.preventDefault()

        if (text.length >0) {
            postMessage({
                variables: {
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
            <Messages user={user} />
            <form onSubmit={(e) => sendMessage(e)}>
                <input placeholder="send a message" onChange={(e) => setText(e.target.value)} ref={chatText}/>
                <button type="submit">Submit</button>
            </form>
        </div>
    )
}

export default Chat