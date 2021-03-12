import React, { useState, useEffect, useRef } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { io } from "socket.io-client";
const ENDPOINT = "http://127.0.0.1:3001";
const mediaDevices = navigator.mediaDevices as any
import Peer from 'peerjs';
const random = uuidv4()


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
const sdk = require('microsoft-cognitiveservices-speech-sdk');
const speechConfig = sdk.SpeechConfig.fromSubscription(process.env.SPEECH_KEY, "eastus")

export default function Videos(props) {

    const [response, setResponse] = useState("");

    const room = "room1";
    const vidGrid = useRef();
    const chatGrid = useRef();
    const allPeers = {}


    useEffect(() => {
        socket.emit('join-room', room, props.user)
        peer.on('open', id => {
            console.log(id)

        })


        socket.on("FromAPI", data => {
            setResponse(data);
        });

        socket.on('user-disconnected', user => {
            //when a user disconnects, this will activate and then the call.on('close') will work
            if (allPeers[user]) allPeers[user].close();
        })


        peer.on('connection', (conn) => {
            console.log(conn)
        })

        //for text chat 

        socket.on('chat-message', (data) => {
            console.log(data)
            const p = document.createElement('p')
            p.innerHTML = data.message.message
            chatGrid.current.append(p)
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

        //let's do clean up here to avoid glitches 

    }
    const initiateChat = (user) => {
        const conn = peer.connect(user)

        conn.on('open', () => {
            conn.on('data', (data) => {
                console.log(data)
            })
        })

        conn.send('hello')
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
                socket.emit('join-room', props.user, e.result.text)    
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
                connectNewUser(user, stream)
                initiateChat(user)
            })

        })

    }, [vidGrid])

    //Sending chat 
    const [chat, setChat] = useState('')
    const chatInput = useRef('')
    const sendMessage = (e) => {

        e.preventDefault();

        socket.emit('send-chat-message', chat)
        setChat('')
        chatInput.current.value = ""
    }


    return (
        <div className="welcome-container">

            <header className="home-nav">
                {response}

                <div id="video-grid" ref={vidGrid}>

                </div>

                <div id="chat-grid" ref={chatGrid} >

                </div>
                {/* <form onSubmit={(e) => sendMessage(e)}>
                    <input placeholder="send a message" onChange={(e) => setChat(e.target.value)} ref={chatInput}/>
                    <button type="submit">Submit</button>
                </form> */}


            </header>

        </div>
    );

}