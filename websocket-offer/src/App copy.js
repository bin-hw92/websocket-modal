import React, { useState, useEffect, useRef } from 'react';
import io from 'socket.io-client';
import SimplePeer from 'simple-peer';
import Main from './Main';

const Offerer = () => {
  const socketRef = useRef();
  const peerRef = useRef(null);
  const dataChannelRef = useRef(null);
  const [receivedMessage, setReceivedMessage] = useState('');
  const [flag, setFlag] = useState(true);

  const createOffer = () => {
    if (!flag) return; // 이미 버튼이 클릭된 상태면 더 이상 실행하지 않음

    peerRef.current = new SimplePeer({ initiator: true });

    peerRef.current.on('signal', (offer) => {
      socketRef.current.emit('sendOffer', 'room-1', 'user-2', offer);
    });

    peerRef.current.on('connect', () => {
      console.log('Offerer connected to Answerer');

      // DataChannel 생성
      dataChannelRef.current = peerRef.current._pc.createDataChannel('my');
      
      dataChannelRef.current.onopen = () => {
        setFlag(false);
        console.log('DataChannel is open');
      };

      dataChannelRef.current.onmessage = event => {
        const test = JSON.parse(event.data);
        console.log('Received message:',event, event.data, test);
      };
    });
  };

  //전송 메시지 보내는 부분......
  const sendMessage = (text) => {
    if (dataChannelRef.current && dataChannelRef.current.readyState === 'open') {
      const obj = {
        message: text,
        timestamp: new Date(),
      };
      dataChannelRef.current.send('testtest');
      console.log(peerRef.current);
      console.log(dataChannelRef.current, '@', dataChannelRef.current.readyState);
    } else {
      console.log('DataChannel is not open or ready.');
    }
  };

  useEffect(() => {
    socketRef.current = io('http://localhost:9000');

    socketRef.current.on('connect', (socket) => {
      console.log('Connected to signal server');
      socketRef.current.emit('createOffer', 'room-1', 'user-1');
      createOffer();
    });

    socketRef.current.on('disconnect', () => {
      console.log('Disconnected from signal server');
    });

    socketRef.current.on('receiveAnswer', (room, answer) => {
      if (peerRef.current ) {
        peerRef.current.signal(answer);
      }
    });

    return () => {
      if (peerRef.current) {
        peerRef.current.destroy();
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div>
      <div>소켓 ID: {socketRef.current?.id}/{dataChannelRef.current?.label}/{peerRef.current?.channelName}</div>
      <Main flag={flag} sendMessage={sendMessage} />
      <div>Received Message: {receivedMessage}</div>
    </div>
  );
};

export default Offerer;
