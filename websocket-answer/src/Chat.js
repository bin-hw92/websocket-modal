import React, {useState, useRef, useEffect, useCallback} from 'react';
import SimplePeer from 'simple-peer';

import io from "socket.io-client";


const Chat = ({ route }) => {
  const peerRef = useRef();
  const socketRef = useRef();
  const otherUser = useRef();
  const dataChannel = useRef();
  const { roomID } = route.params;
  const [message, setMessage] = useState('');

  useEffect(() => {
    socketRef.current = io.connect("http://192.168.1.9:9000");
    socketRef.current.emit("join room", roomID); // Provide Room ID here

    socketRef.current.on("other user", userID => {
      callUser(userID);
      otherUser.current = userID;
    });

    socketRef.current.on("user joined", userID => {
      otherUser.current = userID;
    });

    socketRef.current.on("offer", handleOffer);
    
    socketRef.current.on("answer", handleAnswer);

    socketRef.current.on("ice-candidate", handleNewICECandidateMsg);

  }, []);

  function callUser(userID){
    // This will initiate the call
    console.log("[INFO] Initiated a call")
    peerRef.current = Peer(userID);
    dataChannel.current = peerRef.current.createDataChannel("sendChannel");
    
    // listen to incoming messages
    dataChannel.current.onmessage = handleReceiveMessage;
  }

  function Peer(userID) {
    const peer = new SimplePeer();
    peer.onicecandidate = handleICECandidateEvent;
    peer.onnegotiationneeded = () => handleNegotiationNeededEvent(userID);

    return peer;
  }

  function handleNegotiationNeededEvent(userID){
    // Make Offer
    peerRef.current.createOffer().then(offer => {
       return peerRef.current.setLocalDescription(offer);
    })
    .then(() => {
      const payload = {
        target: userID,
        caller: socketRef.current.id,
        sdp: peerRef.current.localDescription,
      };
      socketRef.current.emit("offer", payload);
    })
    .catch(err => console.log("Error handling negotiation needed event", err));
  }

  function handleOffer(incoming) {
    // Handle Offer made by the initiating peer
    console.log("[INFO] Handling Offer")
    peerRef.current = Peer();
    peerRef.current.ondatachannel = (event) => {
      dataChannel.current = event.channel;
      dataChannel.current.onmessage = handleReceiveMessage;
      console.log('[SUCCESS] Connection established')
    }

    const desc = new RTCSessionDescription(incoming.sdp);
    peerRef.current.setRemoteDescription(desc).then(() => {
    }).then(() => {
      return peerRef.current.createAnswer();
    }).then(answer => {
      return peerRef.current.setLocalDescription(answer);
    }).then(() => {
      const payload = {
        target: incoming.caller,
        caller: socketRef.current.id,
        sdp: peerRef.current.localDescription
      }
      socketRef.current.emit("answer", payload);
    })
  }

  function handleAnswer(message){
    // Handle answer by the remote peer
    const desc = new RTCSessionDescription(message.sdp);
    peerRef.current.setRemoteDescription(desc).catch(e => console.log("Error handle answer", e));
  }

  
  function handleReceiveMessage(e){
    console.log("[INFO] Message received from peer", e.data);
    const msg = [{
      _id: Math.random(1000).toString(),
      text: e.data,
      createdAt: new Date(),
      user: {
        _id: 2,
      },
    }];
    // setMessages(messages => [...messages, {yours: false, value: e.data}]);
  };

  function handleICECandidateEvent(e) {
    if (e.candidate) {
        const payload = {
            target: otherUser.current,
            candidate: e.candidate,
        }
        socketRef.current.emit("ice-candidate", payload);
    }
}

function handleNewICECandidateMsg(incoming) {
  const candidate = new RTCIceCandidate(incoming);

  peerRef.current.addIceCandidate(candidate)
      .catch(e => console.log(e));
}

function sendMessage(){
  console.log(dataChannel.current.readyState, 'send', peerRef);
  if (dataChannel.current.readyState === 'open') {
    console.log(message, 'message')
    dataChannel.current.send(message);
    setMessage('');
  }
}

// console.log(messages);
  return (
    <div>
    <h2>Your Peer ID: </h2>
    <div>
      <ul>
        {/* {receivedMessages.map((message, index) => (
          <li key={index}>{message}</li>
        ))} */}
      </ul>
    </div>
    <div>
      <input
        type="text"
        value={message}
        onChange={(e) => setMessage(e.target.value)}
      />
      <button onClick={sendMessage}>Send</button>
    </div>
  </div>
)
}