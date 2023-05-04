import React, { useState, useEffect } from 'react';
import { VStack, Box, Button } from '@chakra-ui/react';
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
    <VStack spacing={7} mt={10}>
      {sessions.map((session) => (
        <Box key={session.id}>
          <Button onClick={() => router.push(`/pomodoro?sessionID=${session.id}`)}>
            Join Session {session.id}
          </Button>
        </Box>
      ))}
    </VStack>
  );
};

export default PublicSessions;
