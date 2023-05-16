import React, { useState, useEffect } from 'react';
import { VStack, Box, Button, Text, Flex } from '@chakra-ui/react';
import { useRouter } from 'next/router';

interface Session {
  id: string;
  public: boolean;
  startTime: number;
  elapsedTime: number;
}

const PublicSessions: React.FC = () => {
    const router = useRouter();
    const [sessions, setSessions] = useState<Session[]>([]);

    useEffect(() => {
        const fetchSessions = async () => {
          try {
            const res = await fetch('http://localhost:8080/getSessions');
            const data = await res.json(); 

            if(data === null) {
              setSessions([]);
            } else {
              setSessions(data);
            }
          } catch (err) {
            console.error(err);
          }
        };
    fetchSessions();

    }, []);

  return (
    <Flex p={5} w="100%" maxH="300px" overflowY="auto" direction="column" justifyContent="center" alignItems="center">
      <Text color={'white'} fontSize="xl" mb={3}>Public Sessions</Text>
      <VStack spacing={3}>
        {sessions.map((session) => (
          <Box key={session.id} w="100%">
            <Button 
              w="98%"
              maxW="98%" // width
              // h="50px"  // height
              onClick={() => router.push(`/pomodoro?sessionID=${session.id}`)}
            >
              Join Session {session.id}
            </Button>
          </Box>
        ))}
      </VStack>
    </Flex>
  );
};

export default PublicSessions;
