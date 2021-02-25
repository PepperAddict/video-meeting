import React, { useState, useEffect, useRef } from 'react';
import { io } from "socket.io-client";
const ENDPOINT = "http://127.0.0.1:3001";
const mediaDevices = navigator.mediaDevices
import Peer from 'peerjs';
import '../../styles/room.styl'
import { iceServers } from '../../helper/configs.js'

const peer = new Peer(undefined, iceServers)
const socket = io(ENDPOINT);


//this is for speech 
// const sdk = require('microsoft-cognitiveservices-speech-sdk');
// const speechConfig = sdk.SpeechConfig.fromSubscription(process.env.SPEECH_KEY, "eastus")

export default function Videos({room, user}) {

    const vidGrid = useRef();
    const chatGrid = useRef();
    const allPeers = {}
    console.log(allPeers)

    useEffect(() => {

        peer.on('open', id => {
            socket.emit('join-room', room.id, user)
        })

        socket.on('user-disconnected', user => {
            //when a user disconnects, this will activate and then the call.on('close') will work
            if (allPeers[user]) allPeers[user].close();
        })


        peer.on('connection', (conn) => {
            console.log(conn)
        })


        return () => {
            //when leaving, disconnect from socket and remove child elements of vid Grid. 
            if (vidGrid.current) {
                while (vidGrid.current.lastElementChild) {
                    vidGrid.current.removeChild(vidGrid.current.lastElementChild)
                }
            }

            socket.disconnect()
        }
    }, [vidGrid, chatGrid]);

    const addStream = (video, stream) => {

        video.srcObject = stream;
        video.onloadedmetadata = (ev) => {
            video.play()
        }
        vidGrid.current.append(video)
    }

    const connectNewUser = (user, stream) => {

        //making a call. Hello!
        const call = peer.call(user, stream)
        //now that we have calls, let's store the information that way we can close it later
        allPeers[user] = call

        //create teh video element to add and remove
        const video = document.createElement('video')
        video.id = user

        //now they will send their video so we can add
        // call.on('stream', userVideoStream => {
        //     addStream(video, userVideoStream)
        // })

        call.on('close', () => {
            console.log('closed')
            video.remove()
        })

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

            //this is for speech recognition, but currently there is 
            //a bug that results in code 10006 
            //discussion: https://github.com/microsoft/cognitive-services-speech-sdk-js/issues/331

            //  let audioConfig = sdk.AudioConfig.fromDefaultMicrophoneInput()
            //  let recognizer = new sdk.SpeechRecognizer(speechConfig, audioConfig)
            //  recognizer.recognizeOnceAsync(result => {
            //      console.log(result)
            //      console.log('recognized ' + result.text)
            //  })

            //add for ourselves
            addStream(video, stream)


            peer.on('call', call => {
                console.dir(call)

                //answer a call
                call.answer(stream)

                //we should receive their stream after answering call
                const videoTwo = document.createElement('video')
                videoTwo.id = call.peer

                call.on('stream', userVideoStream => {
                    addStream(videoTwo, userVideoStream)
                })

                call.on('close', () => {
                    video.remove()
                })

            })

            socket.on('user-connected', user => {
                console.log(user)
                connectNewUser(user, stream)
            })
        })

    }, [vidGrid])


    return (
        <div className="welcome-container">

            <header className="home-nav">
                <h1>{room.name}</h1>
                <div id="video-grid" ref={vidGrid}></div>
            </header>

        </div>
    );

}
