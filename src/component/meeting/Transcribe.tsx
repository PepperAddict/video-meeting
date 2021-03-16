import React, { useState, useEffect, useRef } from 'react'
import { useSubscription, useMutation } from '@apollo/client'
import { useSelector } from 'react-redux';
import { SUB_TRAN, EDIT_TRAN } from '../../helper/gql.js'

const Messages = ({ user }) => {
    const room = useSelector(state => state.room.value)
    const [editTran] = useMutation(EDIT_TRAN)
    const { data, error } = useSubscription(SUB_TRAN, { variables: { room: room.id } })
    const mainChat = useRef()
    if (error) console.log(error)
    const editableContent = (e, data) => {
        const newData = {
            key: data.id - 1,
            user: data.user,
            content: e.target.innerHTML,
            room: room.id
        }

        if (data.content !== e.target.innerHTML) {
            editTran({ variables: newData })
        }
    }

    const scrollToBottom = () => {
        mainChat.current.scrollIntoView({ behavior: 'smooth' })
    }

    useEffect(() => {
        scrollToBottom()
    }, [data])
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
            }
                    
            ) :
                'no messages'
            }

           <p className="hide-me" ref={mainChat}>bottom</p>     
        </>
    )

}

const Transcribe = ({ user }) => {




    return (
        <div className="transcribe-container">

            <div className="chat-section" >
                <Messages user={user} />
            </div>

        </div>
    )
}

export default Transcribe