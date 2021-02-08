import React, { useState, useEffect } from "react";
import * as firebaseApp from "firebase";

var firebaseConfig = {
  apiKey: "AIzaSyBh6anFXr2UfrwIaKzFfaeeQokv38vg8UI",
  authDomain: "webrtc-communication.firebaseapp.com",
  databaseURL: "https://webrtc-communication.firebaseio.com/",
  projectId: "webrtc-communication",
  storageBucket: "webrtc-communication.appspot.com",
  messagingSenderId: "982834170139",
  appId: "1:982834170139:web:7c1130a4ac20b07308abbe",
  measurementId: "G-B1WS40N340",
};
var firebase = firebaseApp.initializeApp(firebaseConfig);
const servers = {
  iceServers: [
    { urls: "stun:stun.services.mozilla.com" },
    { urls: "stun:stun.l.google.com:19302" },
    {
      urls: "turn:numb.viagenie.ca",
      credential: "qwertyuiop",
      username: "ozqgvaadhmyrakdwod@awdrt.org",
    },
  ],
};

function OtherCams(props) {
  const pc = props.pc;

  var yourId = Math.floor(Math.random() * 1000000000);
  const database = firebase.database().ref();

  const sendMessage = (senderId, data) => {
    var msg = database.push({ sender: senderId, message: data });
    msg.remove();
  };
  const readMessage = (data) => {
    var msg = JSON.parse(data.val().message);
    var sender = data.val().sender;
    if (sender != yourId) {
      console.log(msg);
      if (msg.ice != undefined) {
        pc.addIceCandidate(new RTCIceCandidate(msg.ice));
      } else if (msg.sdp.type == "offer") {
        console.log("offer");
        pc
          .setRemoteDescription(new RTCSessionDescription(msg.sdp))
          .then(() => pc.createAnswer())
          .then((answer) =>
            pc.setLocalDescription(new RTCSessionDescription(answer))
          )
          .then(() =>
            sendMessage(yourId, JSON.stringify({ sdp: pc.localDescription }))
          );
      } else if (msg.sdp.type == "answer") {
        console.log("on answer");
        pc.setRemoteDescription(new RTCSessionDescription(msg.sdp));
      }
    }
  };
  useEffect(() => {
    database.on("child_added", readMessage);
  }, [database]);

  const joinRoom = () => {
    pc.createOffer()
      .then((offer) => pc.setLocalDescription(new RTCSessionDescription(offer)))
      .then(() =>
        sendMessage(yourId, JSON.stringify({ sdp: pc.localDescription }))
      );
    pc.onicecandidate = (event) => {
      event.candidate
        ? sendMessage(yourId, JSON.stringify({ ice: event.candidate }))
        : console.log("Sent All Ice");
      
      
    };
    pc.onaddstream = (event) => {
        const friendsVideo = document.getElementById('cool');
        friendsVideo.srcObject = event.stream;
    }

  };

  return (
    <div>
      <video id='cool' muted autoPlay playsInline></video>

      <button onClick={(e) => joinRoom()}>Connect to Room</button>
    </div>
  );
}

export default function Meeting() {
  const [users] = useState([
    { name: "timmy", id: 123 },
    { name: "Sarah", id: 111 },
    { name: "John", id: 112}
  ]);

  const pc = new RTCPeerConnection(servers);

  const showMyFace = () => {
    const yourVideo = document.getElementById("myvideo");
    navigator.mediaDevices
      .getUserMedia({ audio: true, video: true })
      .then((stream) => (yourVideo.srcObject = stream))
      .then((stream) => pc.addStream(stream));
  };

  return (
    <div>
      <video id="myvideo" autoPlay muted playsInline></video>

      <OtherCams pc={pc} />
      <button onClick={(e) => showMyFace()}>Initiate Cam</button>
    </div>
  );
}
