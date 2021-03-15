import React from 'react'

export default function RoomBanner({ room }) {

    const copyText = () => {
        navigator.clipboard.writeText(room.id)
    }

    return (
        <div>
            <h1>{room.name}</h1>
            <h2>Room ID: {room.id} <span onClick={() => copyText()}>📄</span> </h2>

        </div>
    )
}