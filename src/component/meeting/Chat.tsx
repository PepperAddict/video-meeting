import React, { useState, useEffect, useRef } from 'react'
import { useQuery, useMutation, useSubscription } from '@apollo/client'

import { GET_MESSAGES, SEND_MESSAGE, SUB_MESSAGE } from '../../helper/gql.js'

const Messages = ({ user }) => {
    const { data } = useSubscription(SUB_MESSAGE)

    if (data) {
        console.log(data)
    }


    return (
        <>
            {data ? data.message.map((data, key) => {
                return <p key={key}>{data.user} {data.content}</p>
            }) :
                'no messages'}
        </>
    )

}

const Chat = ({ user }) => {
    const [text, setText] = useState('')
    const [postMessage] = useMutation(SEND_MESSAGE)
    

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
    }

    return (
        <div>
            <Messages user={user} />
            <form onSubmit={(e) => sendMessage(e)}>
                <input placeholder="send a message" onChange={(e) => setText(e.target.value)} />
                <button type="submit">Submit</button>
            </form>
        </div>
    )
}

export default Chat