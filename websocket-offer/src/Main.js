import { useState } from "react";

function Main({flag, sendMessage}) {
  const [message2, setMessage2] = useState('');

  const handle = () => {
    sendMessage(message2)
  }

  return (
    <div >
      Offerer
      <input
        type="text"
        value={message2}
        name="message"
        onChange={(e) => setMessage2(e.target.value)}
      />
      <button onClick={handle} disabled={flag}>Send Message</button>
    </div>
  );
}

export default Main;
