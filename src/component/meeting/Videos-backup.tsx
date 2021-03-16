import React, { useState, useEffect, useRef } from 'react';
import { io } from "socket.io-client";
const ENDPOINT = "http://127.0.0.1:3001";
const mediaDevices = navigator.mediaDevices as any
import Peer from 'simple-peer';
import { useSelector, useDispatch } from 'react-redux';
import RoomBanner from './room_banner'
import { SEND_TRAN } from '../../helper/gql.js'
import { useMutation } from '@apollo/client'
const peer1 = new Peer({initiator: true})
const peer2 = new Peer()

const socket = io(ENDPOINT);
import '../../styles/room.styl'
const sdk = require('microsoft-cognitiveservices-speech-sdk');
const speechConfig = sdk.SpeechConfig.fromSubscription(process.env.SPEECH_KEY, "eastus")

export default function Videos(props) {
    const [postMessage] = useMutation(SEND_TRAN)
    const [response, setResponse] = useState("");
    const user = useSelector(state => state.user.value)
    const room = useSelector(state => state.room.value)

    const vidGrid = useRef();
    const chatGrid = useRef();
    const allPeers = {}

    useEffect(() => {
        console.log(peer1)
        peer1.on('connect', () => {
            console.log('test')
        })
           peer1.on('signal', data => {
               console.log(data)
            peer2.signal(data)
        })

        peer2.on('signal', data => {
            console.log('signal')
            peer1.signal(data)
        })

        peer2.on('stream', stream => {
            const video = document.createElement('video')
            video.id = user
            // got remote video stream, now let's show it in a video tag
            addStream(video, stream)
          })


    }, [])

    useEffect(() => {


        socket.on("FromAPI", data => {
            setResponse(data);
        });

        socket.on('user-disconnected', user => {
            //when a user disconnects, this will activate and then the call.on('close') will work
            if (allPeers[user]) allPeers[user].close();
        })

        //for text chat 

        return () => {
            //when leaving, disconnect from socket and remove child elements of vid Grid. 
            if (vidGrid.current) {
                while (vidGrid.current.lastElementChild) {
                    vidGrid.current.removeChild(vidGrid.current.lastElementChild)
                }
            }

            socket.on('disconnect', () => {
                socket.emit('user-disconnected', room, user)
            })

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

        const video = document.createElement('video')
        video.id = user
        peer2.on('stream', stream => {
            addStream(video, stream)
        })

    }





    useEffect(() => {
        const video = document.createElement('video')
        video.id = "original"
        video.muted = true

        const constraintObj = {
            video: {
                width: { ideal: 4096 },
                height: { ideal: 2160 },
            },
            audio: true
        };
        mediaDevices.getUserMedia(constraintObj).then(stream => {

            let audioConfig = sdk.AudioConfig.fromDefaultMicrophoneInput()
            let recognizer = new sdk.SpeechRecognizer(speechConfig, audioConfig)
            recognizer.startContinuousRecognitionAsync();

            recognizer.recognized = (s, e) => {
                
                if (e.result.text) {
                 console.log(e.result.text)   
                // postMessage({
                //     variables: {
                //         user, 
                //         content: e.result.text,
                //         room: room.id
                //     }
                // })   
                }
                
            };

            recognizer.canceled = (s, e) => {
                console.log(`CANCELED: Reason=${e.reason}`);
                recognizer.stopContinuousRecognitionAsync();
            };

            recognizer.sessionStopped = (s, e) => {
                console.log("\n    Session stopped event.");
                recognizer.stopContinuousRecognitionAsync();
            };

            //add for ourselves
            addStream(video, stream)


            socket.on('user-connected', user => {
                connectNewUser(user, stream)

            })

        })

    }, [vidGrid])




    return (
        <div className="video-container">

            <header className="home-nav">
                <RoomBanner room={room}/>

                <div id="video-grid" ref={vidGrid}>

                </div>

            </header>

        </div>
    );

}