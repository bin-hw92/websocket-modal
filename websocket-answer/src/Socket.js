import React, { useRef } from 'react';
import {io} from 'socket.io-client';

const WebSocketContext = React.createContext(null);
export { WebSocketContext };

const WebScoketProvider = ({ children }) => {
  const webSocketUrl = io("http://localhost:3001");
  let ws = useRef(null);

  
  if (!ws.current) {
    ws.current = webSocketUrl;
    ws.current.onopen = () => {
      console.log("connected to " + webSocketUrl);
    }
    ws.current.onclose = error => {
      console.log("disconnect from " + webSocketUrl);
      console.log(error);
    };
    ws.current.onerror = error => {
      console.log("connection error " + webSocketUrl);
      console.log(error);
    };
  }

  return (
    <WebSocketContext.Provider value={ws}>
      {children}
    </WebSocketContext.Provider>
  );
};

export default WebScoketProvider;