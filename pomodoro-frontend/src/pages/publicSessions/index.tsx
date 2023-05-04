import React, { useState, useEffect } from 'react';
import { VStack, Box, Button, Text } from '@chakra-ui/react';
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
        //   const res = await fetch('http://localhost:8080/getSessions');
        //   const data = await res.json();
                setSessions([{"id":"tqwcFiUI","public":true,"startTime":0,"elapsedTime":0},{"id":"LzXv2fcN","public":true,"startTime":0,"elapsedTime":6}]);
        };
    fetchSessions();

    }, []);

  return (
    <Box borderWidth={1} borderRadius="md" boxShadow="md" p={5} w="300px" maxH="400px" overflowY="auto">
      <Text fontSize="xl" mb={3}>Public Sessions</Text>
      <VStack spacing={3}>
        {sessions.map((session) => (
          <Box key={session.id}>
                        <Button onClick={() => router.push(`/pomodoro?sessionID=${session.id}`)}>
              Join Session {session.id}
            </Button>
          </Box>
        ))}
      </VStack>
    </Box>
  );
};

export default PublicSessions;
