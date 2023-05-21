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
  Grid,
  Spinner
} from "@chakra-ui/react";
import { useRouter, NextRouter } from "next/router";
import { auth } from '../../../config/firebaseConfig';
import UserList from "@/components/userList";
import { MoonIcon, SunIcon } from "@chakra-ui/icons";
import Chat from "../chat";

interface PomodoroProps {
  initialSessionID?: string;
}

const Pomodoro: React.FC = () => {

  const router = useRouter();
  const [createSession, setCreateSession] = useState(false);
  const [sessionID, setSessionID] = useState(null);

  const [time, setTime] = useState(0);
  const [intervalId, setIntervalId] = useState<NodeJS.Timeout | null>(null);
  const [ws, setWebSocket] = useState<WebSocket | null>(null);
  const [isPublic, setIsPublic] = useState(true);
  const [friendEmail, setFriendEmail] = useState('');
  const { colorMode, toggleColorMode } = useColorMode();

  useEffect(() => {
    console.log(router.query);
    if (router.query.sessionID) {
      console.log(`session id ${router.query.sessionID}`)
      setSessionID(router.query.sessionID);
    } else {
      setIsPublic(router.query.isPublic);
      setCreateSession(true);
    }
  }, [router.query])

  useEffect(() => {
    console.log(sessionID);
    handleJoinSession();
  }, [sessionID]);

  useEffect(() => {
    if (createSession) {
      console.log(`CREATING SESSION ${createSession}`)
      handleCreateSession();
    }
  }, [createSession]);

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

  const setupWebSocket = (path: string): WebSocket => {
    const newWs = new WebSocket(`ws://localhost:8080${path}`);
    setWebSocket(newWs);
    return newWs;
  };

  const handleCreateSession = () => {
    console.log("CRIEI UMA SESSÃO");
    console.log(isPublic);
    const newWs = setupWebSocket(`/ws/create?public=${isPublic}&userId=${auth.currentUser?.uid}`);
  
    // Listen for the 'created' event
    newWs.addEventListener('message', (event) => {
      console.log("Message event fired");

      const message = JSON.parse(event.data);
      if (message.action === 'created') {
        const newSessionID = message.data;
        setSessionID(newSessionID);
  
        // Redirect to the Pomodoro page with the new session ID
        // router.push(`/pomodoro?sessionID=${newSessionID}`);
      }
    });
  };

  const handleJoinSession = () => {
    if (!sessionID) return;
    setupWebSocket(`/ws/join?session=${sessionID}&userId=${auth.currentUser?.uid}`);
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
        <Flex direction="column" justify="center" align="center" height="93vh">
          <Grid templateColumns="1fr 2.5fr 1fr" gap={6} p={6}>
            <Box>
              {!sessionID ?
                  <Flex justify="center" align="center">
                    <Spinner size="xl" color="red.200" thickness='4px' speed='0.65s'/>
                  </Flex> :
              <UserList ws={ws} sessionID={sessionID} />
              }
            </Box>
            <Box bg={'red.900'} borderRadius={'lg'} p={5} minH="50vh" alignContent={"center"}>
              <Flex direction="column" justify="center" align="center" height="100%">
              {!sessionID ?
                <Flex justify="center" align="center">
                  <Spinner size="xl" color="red.200" thickness='4px' speed='0.65s'/>
                </Flex>
                :
                <VStack spacing={4} w="100%">
                  <Box>
                    <Text fontSize="5xl" fontWeight="bold" color={"white"}>
                      PomoSync
                    </Text>
                  </Box>
                  <Box>
                    <audio ref={audioRef} src="/alarm.mp3" />
                  </Box>
                  <FormControl maxW="xs" mt={8} alignSelf="center">
                    <Flex alignItems="center" justifyContent="center">
                      <FormLabel fontSize="2xl" htmlFor="session-id" color={"white"}>
                        Session ID: {sessionID}
                      </FormLabel>
                    </Flex>
                  </FormControl>
                  
                  <Box position="relative">
                    <CircularProgress
                      value={progressValue()}
                      size="300px"
                      thickness="12px"
                      color="red.400"
                      capIsRound
                      trackColor={colorMode === "light" ? "gray.300" : "gray.600"}
                    />
                    <VStack
                      position="absolute"
                      top="50%"
                      left="50%"
                      transform="translate(-50%, -50%)"
                      zIndex="1"
                    >
                      <Text fontSize="4xl" fontWeight="bold" color={"white"}>
                        {displayType()}
                      </Text>
                      <Text fontSize="6xl" fontWeight="bold" my={4} color={"white"}>
                        {displayTime()}
                      </Text>
                    </VStack>
                  </Box>
        
                  <Box mb={40}>
                    <Flex mb={100}>
                      <Button fontSize="xl" onClick={handlePause} mr={2}>
                        Pause
                      </Button>
                      <Button fontSize="xl" onClick={handlePlay}>
                        Play
                      </Button>
                    </Flex>
                  </Box>
        
                  <Box mt="30">
                    <Flex>
                      <Input
                        _placeholder={{ color: 'white' }}
                        color="white"       
                        mr="5"
                        type="email"
                        id="friend-email"
                        placeholder="Friend's email"
                        mb={4}
                        size="md"
                        maxWidth="400px"
                        fontSize="xl"
                        value={friendEmail}
                        onChange={(e) => setFriendEmail(e.target.value)}
                      />
                      <Button
                        onClick={handleSendEmailInvite}
                        size={"md"}
                        width="200px"
                      >
                        Send Email Invite
                      </Button>
                    </Flex>
                  </Box>
                </VStack>
              }
              </Flex>
            </Box>
            <Box>
              <Chat ws={ws} />
            </Box>
          </Grid>
        </Flex>
  );
  
  

};


export default Pomodoro;