import React, { useState, useEffect, useRef } from 'react';
import io from 'socket.io-client';
import SimplePeer from 'simple-peer';

function App() {
  const peerRef = useRef();
  const [message, setMessage] = useState('');
  const [receivedMessages, setReceivedMessages] = useState([]);
  const socketRef = useRef();
  const otherUser = useRef();
  const sendChannel = useRef();

  useEffect(() => {
    socketRef.current = io.connect('http://localhost:5000'); // 서버 주소를 적절히 변경하세요
/* 
    socketRef.current.on('connect', () => {
      console.log('Connected to server');
    }); */

    console.log(socketRef.current)

    socketRef.current.emit("join room", '127.0.0.1'); // Provide Room ID here

    socketRef.current.on("other user", userID => {
      callUser(userID);
      otherUser.current = userID;
    });

    socketRef.current.on("user joined", userID => {
      otherUser.current = userID;
    });

    socketRef.current.on("offer", handleOffer);
    
    socketRef.current.on("answer", handleAnswer);

    socketRef.current.on("ice-candidate", (data) => {
      setReceivedMessages([...receivedMessages, data]);
    });

    return () => {
      socketRef.current.disconnect();
    };
  }, []);
  
  function handleOffer(incoming) {
    // Handle Offer made by the initiating peer
    console.log("[INFO] Handling Offer")
    peerRef.current = Peer();
    peerRef.current.ondatachannel = (event) => {
      sendChannel.current = event.channel;
      sendChannel.current.onmessage = handleReceiveMessage;
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

  const callUser= (userID) => {
    // This will initiate the call
    console.log("[INFO] Initiated a call")
    peerRef.current = Peer(userID);
    sendChannel.current = peerRef.current._pc.createDataChannel("sendChannel");
    
    // listen to incoming messages
    sendChannel.current.onmessage = handleReceiveMessage;
  }

  const Peer = (userID) => {
    const peer = new SimplePeer({
      iceServers: [
          {
              urls: "stun:stun.stunprotocol.org"
          },
         ]
      });
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

  function handleICECandidateEvent(e) {
    if (e.candidate) {
      const payload = {
        target: otherUser.current,
        candidate: e.candidate,
      }
      socketRef.current.emit("ice-candidate", payload);
    }
  }

  function handleReceiveMessage(e){
    console.log("[INFO] Message received from peer", '22@@@',e);
  };

  const sendMessage = () => {
    if (peerRef.current.readyState === 'open') {
      console.log(peerRef.current)
      peerRef.current.send(message);
      setReceivedMessages([...receivedMessages, { text: message, sender: 'You' }]);
      setMessage('');
    
    } else {
      console.error('RTCDataChannel is not open.');
    }
  };

  return (
    <div className="App">
      <h1>P2P Chat App</h1>
      <div className="chat-box">
        {receivedMessages.map((msg, index) => (
          <div key={index} className={`message ${msg.sender === 'You' ? 'sent' : 'received'}`}>
            <p>{msg.text}</p>
          </div>
        ))}
      </div>
      <input
        type="text"
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        placeholder="Type your message..."
      />
      <button onClick={sendMessage}>Send</button>
      {/* <button onClick={() => console.log}>Connect to Peer</button> */}
    </div>
  );
}

export default App;
