import { useState } from "react";

function Main({sendMessage, createAnswer, createAnswerClicked}) {
  const [message2, setMessage2] = useState('');

  const handle = () => {
    sendMessage(message2)
  }

  return (
    <div >
      
      <button onClick={createAnswer} disabled={createAnswerClicked}>Create Answer</button>
     Answer
      <input
        type="text"
        value={message2}
        name="message"
        onChange={(e) => setMessage2(e.target.value)}
      />
      <button onClick={handle}>Send Message</button>
    </div>
  );
}

export default Main;
