import React, { useState, useEffect, useRef } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { io } from "socket.io-client";
const ENDPOINT = "http://127.0.0.1:3000";
const mediaDevices = navigator.mediaDevices as any
import Peer from 'peerjs';
const usa = uuidv4()
const peer = new Peer(undefined, {
  config: {
    iceServers: [
      { urls: "stun:stun.services.mozilla.com" },
      { urls: "stun:stun.l.google.com:19302" },
      {
        urls: "turn:numb.viagenie.ca",
        credential: "qwertyuiop",
        username: "ozqgvaadhmyrakdwod@awdrt.org",
      },
    ],
  }
})
const socket = io(ENDPOINT);
import '../../styles/room.styl'


export default function Room(props) {
  const [response, setResponse] = useState("");

  const userVideo = useRef();
  const partnerVideo = useRef();
  const vidGrid = useRef();
  const listOfPeers = {}



  useEffect(() => {

    peer.on('open', id => {
      console.log(id)
      socket.emit('join-room', 'room1', id)
    })


    socket.on("FromAPI", data => {
      setResponse(data);
    });


    return () => socket.disconnect()
  }, [vidGrid]);

  const addStream = (video, stream) => {
    console.log(video.className)
    video.srcObject = stream;
    video.onloadedmetadata = (ev) => {
      video.play()
    }
    vidGrid.current.append(video)
  }

  const connectNewUser = (user, stream) => {
    console.log(peer)

    //making a call. Hello!
    const call = peer.call(user, stream)

    const videoTwo = document.createElement('video')
    videoTwo.className = "vidi"

    //Let's send in our stream

    call.on('stream', userVideoStream => {

      console.log('uStream')
      addStream(videoTwo, userVideoStream)
    })

    call.on('close', () => {
      console.log('closed')
      videoTwo.remove()
    })

    listOfPeers[user] = call

  }




  useEffect(() => {
    const video = document.createElement('video')
    video.className = "original"
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

        console.log('ring ring')

        //send our stream
        call.answer(stream)





        call.on('stream', userVideoStream => {
          const videoTwo = document.createElement('video')
          videoTwo.className = "hiyo"
          console.log('uStream')
          addStream(videoTwo, userVideoStream)
        })


      })

      socket.on('user-connected', user => {
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

      </header>

    </div>
  );

}
