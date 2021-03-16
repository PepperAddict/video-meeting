import React, { useState, useEffect, useRef } from 'react'
import { useSubscription, useMutation } from '@apollo/client'
import { useSelector } from 'react-redux';
import { SUB_TRAN, EDIT_TRAN } from '../../helper/gql.js'

const Messages = ({ user }) => {
    const room = useSelector(state => state.room.value)
    const [text, setText] = useState('')
    const [editTran] = useMutation(EDIT_TRAN)
    const { data, error } = useSubscription(SUB_TRAN, {variables: {room: room.id}})

    if (error) console.log(error)
    const editableContent = (e, data) => {
            const newData = {
                key: data.id -1,
                user: data.user, 
                content: e.target.innerHTML,
                room: room.id
            }

            editTran({variables: newData}).then((res) => {
                console.log(res)
            })
    }

    const customize = (e, data) => {

        if (e.key === 'Enter') {
            e.preventDefault()
            editableContent(e, data)
        }
    }

    return (
        <>
            {data ? data.transcription.map((data, key) => {

                return <div key={key} >
                     <span className="name">{data.user}</span>
                     <div tabIndex={key} id={key} contentEditable="true" onKeyDown={(e) => customize(e, data)} suppressContentEditableWarning="true" onBlur={(e) => editableContent(e, data)}>{data.content}</div>
                     </div>
            }) :
                'no messages'
                }
        </>
    )

}

const Transcribe = ({ user, setChat }) => {
    const mainChat = useRef()

    const scrollToBottom = () => {
        mainChat.current.scrollIntoView({behavior: 'smooth'})
    }


    return (
        <div className="transcribe-container">
            
        <div className="chat-section" >
            <Messages user={user} />
            <p ref={mainChat}>bottom</p>
        </div> 
</div>
    )
}

export default Transcribe