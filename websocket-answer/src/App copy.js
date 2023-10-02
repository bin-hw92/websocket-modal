import React, { useState, useEffect, useRef } from 'react';
import io from 'socket.io-client';
import SimplePeer from 'simple-peer';
import Main from './Main';

const Answerer = () => {
  const socketRef = useRef();
  const peerRef = useRef(null);
  const dataChannelRef = useRef(null);
  const [receivedMessage, setReceivedMessage] = useState('');
  const [createAnswerClicked, setCreateAnswerClicked] = useState(false);

  const handleMessage = () => {
    console.log('testtestest');
  }

  const createAnswer = () => {
    if (createAnswerClicked) return; // 이미 버튼이 클릭된 상태면 더 이상 실행하지 않음
    peerRef.current  = new SimplePeer({ initiator: true });

    peerRef.current.on('signal', (answer) => {
      socketRef.current.emit('sendAnswer', 'room-1', 'user-1', 'user-2', answer);
    });

    peerRef.current.on('connect', () => {
      console.log('Answerer connected to Offerer');

      dataChannelRef.current = peerRef.current._pc.createDataChannel('my');
    
      dataChannelRef.current.onopen = () => {
        setCreateAnswerClicked(true);
        console.log('DataChannel opened');
      };
      dataChannelRef.current.onmessage = (event) => {
        const test = JSON.parse(event.data);
        console.log('Received message:',event, event.data, test);
      };
    });
  };

  const sendMessage  = (text) => {
    if (dataChannelRef.current && dataChannelRef.current.readyState === 'open') {
      const obj = {
        message: text,
        timestamp: new Date(),
      };
      dataChannelRef.current.send('testtes22222222');
      console.log(peerRef.current);
      console.log(dataChannelRef.current, '@', dataChannelRef.current.readyState);
    } else {
      console.log('DataChannel is not open or ready.');
    }
  };

  const sendSignal = (signalData) => {
    try {
      if (!peerRef.current.destroyed) {
        peerRef.current.signal(signalData);
      } else {
        // 이미 파괴된 Peer에 대한 처리
        peerRef.current.destroy();
      }
    } catch (error) {
      console.error('Error sending signal:', error);
      // 오류 처리 로직 추가
    }
  };

  useEffect(() => {
    socketRef.current = io('http://localhost:9000');

    socketRef.current.on('connect', () => {
      console.log('Connected to signal server');
    });

    socketRef.current.on('none', () => {
      console.log('방이 없습니다.');
    });

    socketRef.current.on('disconnect', () => {
      console.log('Disconnected from signal server');
    });

    socketRef.current.on('receiveOffer', (room, offer) => {
      if (peerRef.current) {
        if(dataChannelRef.current?.readyState === 'close'){
          peerRef.current.destroy();
          return;
        }
        sendSignal(offer);
      }
    });

    return () => {
      if (peerRef.current) {
        peerRef.current.destroy();
      }
    };
  }, []);


  return (
    <div>
      <div>소켓 ID: {socketRef.current?.id}/{dataChannelRef.current?.label}/{peerRef.current?.channelName}</div>
      <Main sendMessage={sendMessage} createAnswer={createAnswer} createAnswerClicked={createAnswerClicked} />
      <div>Received Message: {receivedMessage}</div>
    </div>
  );
};

export default Answerer;
