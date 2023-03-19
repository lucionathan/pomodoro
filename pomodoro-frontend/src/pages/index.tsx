import React, { useState, useEffect } from 'react';

const IndexPage: React.FC = () => {
  const [time, setTime] = useState(0);
  const [intervalId, setIntervalId] = useState<NodeJS.Timeout | null>(null);
  const [sessionID, setSessionID] = useState<string | null>(null);
  const [ws, setWebSocket] = useState<WebSocket | null>(null);

  useEffect(() => {
    if (!ws) return;
  
    const handleMessage = (event: MessageEvent) => {
      const message = JSON.parse(event.data);
      switch (message.action) {
        case 'pause':
          if (intervalId) clearInterval(intervalId);
          break;
        case 'play':
          const startTime = message.startTime;
          const elapsedTime = message.elapsedTime;
          setTime(elapsedTime);
  
          if (intervalId) clearInterval(intervalId);
  
          const newIntervalId = setInterval(() => {
            const currentTime = new Date().getTime();
            setTime((prevTime) => elapsedTime + Math.floor((currentTime - startTime) / 1000));
          }, 1000);
  
          setIntervalId(newIntervalId);
          break;
      }
    };
  
    ws.addEventListener('message', handleMessage);
    return () => {
      ws.removeEventListener('message', handleMessage);
    };
  }, [ws, intervalId]);  

  const setupWebSocket = (path: string) => {
    const newWs = new WebSocket(`ws://localhost:8080${path}?session=${sessionID}`);
    setWebSocket(newWs);
  };

  const handleCreateSession = () => {
    setupWebSocket('/ws/create');
  };

  const handleJoinSession = () => {
    if (!sessionID) return;
    setupWebSocket('/ws/join');
  };

  const handlePause = () => {
    if (!ws) return;
    const message = {
      action: 'pause',
      data: '',
    };
    ws.send(JSON.stringify(message));
  };

  const handlePlay = () => {
    if (!ws) return;
    const message = {
      action: 'play',
      data: time.toString(),
    };
    ws.send(JSON.stringify(message));
  };

  const displayTime = () => {
    const minutes = Math.floor(time / 60);
    const seconds = time % 60;
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <div>
      <h1>Pomodoro Timer</h1>
      <p>
        <label htmlFor="session-id">Session ID:</label>
        <input
          type="text"
          id="session-id"
          onChange={(e) => setSessionID(e.target.value)}
        />
        <button onClick={handleCreateSession}>Create New Session</button>
        <button onClick={handleJoinSession}>Join Existing Session</button>
      </p>
      <p>{displayTime()}</p>
      <button onClick={handlePause}>Pause</button>
      <button onClick={handlePlay}>Play</button>
    </div>
  );
};

export default IndexPage;