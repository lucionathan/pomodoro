import React, { useState, useEffect, useContext } from 'react';
import {
  Box,
  Button,
  Flex,
  FormControl,
  FormLabel,
  Input,
  Text,
} from "@chakra-ui/react";

const Pomodoro: React.FC = () => {
  const [time, setTime] = useState(0);
  const [intervalId, setIntervalId] = useState<NodeJS.Timeout | null>(null);
  const [sessionID, setSessionID] = useState<string | null>(null);
  const [ws, setWebSocket] = useState<WebSocket | null>(null);
    
  // const studyTime = 25 * 60;
  const studyTime = 10;
  const restingTime = 5 * 60;


  useEffect(() => {
    if (!ws) return;
  
    const handleMessage = (event: MessageEvent) => {
      const message = JSON.parse(event.data);
      switch (message.action) {
        case 'created':
          setSessionID(message.data);
          break;
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
        };
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
    const checkType = (time % (studyTime + restingTime));
  
    const decreasingTime = checkType < studyTime ? studyTime - checkType : restingTime - (checkType - studyTime);
    const minutes = Math.floor(decreasingTime / 60);
    const seconds = decreasingTime % 60;
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  const displayType = () => {
    const checkType = (time % (studyTime + restingTime));
    const operationType = checkType < studyTime ? "Study" : "Resting";

    return operationType;
  }

  return (
    <Box
      display="flex"
      flexDirection="column"
      alignItems="center"
      justifyContent="center"
      height="100vh"
      mx="auto"
    >
      <Text fontSize="4xl" fontWeight="bold">
        Pomodoro Timer
      </Text>
      <FormControl maxW="xs" mt={8}>
        <FormLabel fontSize="2xl" htmlFor="session-id">Session ID: {sessionID}</FormLabel>
        <Input
          type="text"
          id="session-id"
          onChange={(e) => setSessionID(e.target.value)}
          mb={4}
          size="sm"
          fontSize="xl"
        />
        <Flex>
          <Button onClick={handleCreateSession} mr={2}>
            Create Session
          </Button>
          <Button onClick={handleJoinSession}>Join Session</Button>
        </Flex>
      </FormControl>
      <Text fontSize="4xl" fontWeight="bold" mt="6">{displayType()}</Text>
      <Text fontSize="6xl" fontWeight="bold" my={4}>
        {displayTime()}
      </Text>
      <Flex>
        <Button fontSize="xl" onClick={handlePause} mr={2}>
          Pause
        </Button>
        <Button fontSize="xl" onClick={handlePlay}>Play</Button>
      </Flex>
    </Box>
  );
};

export default Pomodoro;