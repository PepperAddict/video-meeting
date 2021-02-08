import React, { useState, useEffect, useRef } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { io } from "socket.io-client";
const ENDPOINT = "http://127.0.0.1:3000";
const mediaDevices = navigator.mediaDevices as any
import Peer from 'peerjs';
const peer = new Peer()
const socket = io(ENDPOINT);
import '../../styles/room.styl'

export default function Room(props) {
  const [response, setResponse] = useState("");

  const userVideo = useRef();
  const partnerVideo = useRef();
  const vidGrid = useRef();
  const listOfPeers = {}


  useEffect(() => {


    socket.on("FromAPI", data => {
      setResponse(data);
    });

    peer.on('open', id => {
      socket.emit('join room', uuidv4(), socket.id)
    })

    socket.on('user-dc', user => {
      console.log('user ' + user)
    })

    return () => socket.disconnect()
  }, [vidGrid]);

  const addStream = (video, stream) => {
    video.srcObject = stream;
    video.onloadedmetadata = (ev) => {
      video.play()
    }
    vidGrid.current.append(video)
  }

  const connectNewUser = (user, stream) => {
    const call = peer.call(user, stream)
    const video = document.createElement('video')

    call.on('stream', uStream => {
      addStream(video, uStream)
    })

    call.on('close', () => {

      video.remove()
    })

    listOfPeers[user] = call

    console.log(listOfPeers)
  }




  useEffect(() => {
    const video = document.createElement('video')
    video.muted = true
    const constraintObj = {
      video: {
        width: { ideal: 4096 },
        height: { ideal: 2160 },
      },
      audio: true
    };
    mediaDevices.getUserMedia(constraintObj).then(stream => {
      //add for ourselves
      addStream(video, stream)

      //send our stream
      peer.on('call', call => {
        call.answer(stream)

        const video = document.createElement('video')
        addStream(video, stream)

      })

      //socket communication

      socket.on('user-connected', (user) => {
        console.log(user)
        connectNewUser(user, stream)
      })

    })

  }, [vidGrid])


  return (
    <div className="welcome-container">

      <header className="home-nav">
        {response}

        <div id="video-grid" ref={vidGrid}>

        </div>
        <video autoPlay ref={userVideo} />
        <video autoPlay ref={partnerVideo} />
      </header>

    </div>
  );

}
