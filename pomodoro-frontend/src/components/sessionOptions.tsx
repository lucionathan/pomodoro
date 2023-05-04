import React from 'react';
import { useRouter } from 'next/router';
import { Box, Button, VStack } from '@chakra-ui/react';

const SessionOptions: React.FC = () => {
  const router = useRouter();

  const handleCreateSession = () => {
    router.push('/pomodoro?createSession=true');
  };

  return (
    <VStack spacing={7}>
    <Button mt={10} size='lg' onClick={() => router.push('/publicSessions')}>List Public Sessions</Button>
      <Button size='lg' onClick={handleCreateSession}>Create Session</Button>
      <Button size='lg' onClick={() => router.push('/joinSession')}>Join Session</Button>
    </VStack>
  );
};

export default SessionOptions;
