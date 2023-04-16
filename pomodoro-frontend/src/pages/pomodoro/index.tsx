import React, { useState, useEffect, useRef } from "react";
import {
  Box,
  Button,
  Flex,
  FormControl,
  FormLabel,
  Input,
  Text,
  Switch,
  HStack,
  useColorMode,
  IconButton,
  CircularProgress,
  VStack,
} from "@chakra-ui/react";
import { MoonIcon, SunIcon } from "@chakra-ui/icons";

const Pomodoro: React.FC = () => {
  const [time, setTime] = useState(0);
  const [intervalId, setIntervalId] = useState<NodeJS.Timeout | null>(null);
  const [sessionID, setSessionID] = useState<string | null>(null);
  const [ws, setWebSocket] = useState<WebSocket | null>(null);
  const [isPublic, setIsPublic] = useState(true);
  const [friendEmail, setFriendEmail] = useState('');
  const { colorMode, toggleColorMode } = useColorMode();

  const handleSendEmailInvite = async () => {
    if (!sessionID || !friendEmail) return;

    const res = await fetch('/api/send-invite-email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ friendEmail, sessionID }),
    });

    if (res.ok) {
      alert('Email invite sent successfully!');
    } else {
      const data = await res.json();
      alert(`Error sending email invite: ${data.message}`);
    }
  };

  const audioRef = useRef<HTMLAudioElement>(null);

  const studyTime = 25 * 60;
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
    const newWs = new WebSocket(`ws://localhost:8080${path}`);
    setWebSocket(newWs);
  };

  const handleCreateSession = () => {
    console.log(isPublic);
    setupWebSocket(`/ws/create?public=${isPublic}`);
  };

  const handleJoinSession = () => {
    if (!sessionID) return;
    setupWebSocket(`/ws/join?session=${sessionID}`);
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

    if (decreasingTime === 1) {
      console.log("cheguei no audio")
      if (audioRef.current) {
        audioRef.current.play();
      }
    }

    const minutes = Math.floor(decreasingTime / 60);
    const seconds = decreasingTime % 60;
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  const displayType = () => {
    const checkType = (time % (studyTime + restingTime));
    const operationType = checkType < studyTime ? "Study" : "Resting";

    return operationType;
  }

  const progressValue = () => {
    const checkType = time % (studyTime + restingTime);
    const decreasingTime = checkType < studyTime ? studyTime - checkType : restingTime - (checkType - studyTime);
  
    if (checkType < studyTime) {
      return ((studyTime - decreasingTime) / studyTime) * 100;
    } else {
      return ((restingTime - decreasingTime) / restingTime) * 100;
    }
  };

  return (
    <VStack
      spacing={10}
      display="flex"
      alignItems="center"
      justifyContent="center"
      minHeight="100vh"
      px={4}
      bgColor={colorMode === "light" ? "gray.100" : "gray.700"}
    >
      <Flex width="100%" justifyContent="flex-end">
        <IconButton
          icon={colorMode === "light" ? <MoonIcon /> : <SunIcon />}
          onClick={toggleColorMode}
        />
      </Flex>
      <Box>
        <Text fontSize="5xl" fontWeight="bold">
          Pomodoro Timer
        </Text>
      </Box>
      <Box>
        <audio ref={audioRef} src="/alarm.mp3" />
      </Box>
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
        <HStack mt={4}>
          <Switch
            id="public-switch"
            isChecked={isPublic}
            onChange={(e) => setIsPublic(e.target.checked)}
          />
          <FormLabel htmlFor="public-switch" mb="0">
            Public Session
          </FormLabel>
        </HStack>
        <Flex>
          <Button onClick={handleCreateSession} mr={2}>
            Create Session
          </Button>
          <Button onClick={handleJoinSession}>Join Session</Button>
        </Flex>
      </FormControl>
      <Box>
        <CircularProgress
          value={progressValue()}
          size="300px"
          thickness="12px"
          color="red.400"
          capIsRound
          trackColor={colorMode === "light" ? "gray.300" : "gray.600"}
        >
          <Box>
            <Text fontSize="4xl" fontWeight="bold">
              {displayType()}
            </Text>
            <Text fontSize="6xl" fontWeight="bold" my={4}>
              {displayTime()}
            </Text>
          </Box>
        </CircularProgress>

      </Box>
      <Flex>
        <Button fontSize="xl" onClick={handlePause} mr={2}>
          Pause
        </Button>
        <Button fontSize="xl" onClick={handlePlay}>
          Play
        </Button>
      </Flex>
      <Input
        type="email"
        id="friend-email"
        placeholder="Friend's email"
        mb={4}
        size="sm"
        fontSize="xl"
        value={friendEmail}
        onChange={(e) => setFriendEmail(e.target.value)}
      />
      <Button onClick={handleSendEmailInvite}>
        Send Email Invite
      </Button>
    </VStack>
  );

};

export default Pomodoro;