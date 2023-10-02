import React, { useState, useEffect, useRef } from 'react';
import SimplePeer from 'simple-peer';
import io from 'socket.io-client';

const MyComponent = () => {
  const [message, setMessage] = useState('');
  const [receivedMessages, setReceivedMessages] = useState([]);
  const [peerId, setPeerId] = useState('');
  const socketRef = useRef();
  const peerRef = useRef();

  useEffect(() => {
    socketRef.current = io.connect("http://127.0.0.1:9000");
    socketRef.current.emit("join room", '127.0.0.1'); // Provide Room ID here

    socketRef.current.on("other user", userID => {
      callUser(userID);
      setPeerId(userID);
    });

    socketRef.current.on("user joined", userID => {
      setPeerId(userID);
    });

    socketRef.current.on("offer", handleOffer);
    
    socketRef.current.on("answer", handleAnswer);

    socketRef.current.on("ice-candidate", handleNewICECandidateMsg);

  }, []);

  function callUser(userID){
    console.log("[INFO] Initiated a call");
    peerRef.current = new SimplePeer({ initiator: true }); // Initiator is set to true for the caller
    
    peerRef.current.on('signal', (signal) => {
      const payload = {
        target: userID,
        caller: socketRef.current.id,
        signal,
      };
      socketRef.current.emit("offer", payload);
    });
  }

  function handleOffer(incoming) {
    console.log("[INFO] Handling Offer");
    peerRef.current = new SimplePeer(); // Initiator is set to false for the receiver

    peerRef.current.on('signal', (signal) => {
      const payload = {
        target: incoming.caller,
        caller: socketRef.current.id,
        signal,
      };
      socketRef.current.emit("answer", payload);
    });

    peerRef.current.signal(incoming.signal);
  }

  function handleAnswer(message){
    console.log("[INFO] Handling Answer");
    peerRef.current.signal(message.signal);
  }

  function handleReceiveMessage(e){
    console.log("[INFO] Message received from peer", e);
    setReceivedMessages([...receivedMessages, e]);
  };

  function handleNewICECandidateMsg(incoming) {
    const candidate = new RTCIceCandidate(incoming.candidate);

    peerRef.current.addIceCandidate(candidate)
      .catch(e => console.log(e));
  }

function sendMessage(){
  if (peerRef.current.readyState === 'open') {
    peerRef.current.send(message);
    setMessage('');
  } else {
    console.error('RTCDataChannel is not open.');
  }
}

  return (
    <div>
      <h2>Your Peer ID: {peerId}</h2>
      <div>
        <ul>
          {receivedMessages.map((message, index) => (
            <li key={index}>{message}</li>
          ))}
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
  );
}

export default MyComponent;
