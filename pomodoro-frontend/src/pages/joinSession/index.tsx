import React, { useState } from 'react';
import { Box, Button, FormControl, FormLabel, Input, VStack } from '@chakra-ui/react';
import { useRouter } from 'next/router';

const JoinSession: React.FC = () => {
  const [sessionID, setSessionID] = useState('');
  const router = useRouter();

  const handleJoinSession = () => {
    router.push(`/pomodoro?sessionID=${sessionID}`);
  };

  return (
    <VStack
      spacing={4}
      display="flex"
      alignItems="center"
      justifyContent="center"
      minHeight="100vh"
      px={4}
    >
      <Box>
        <FormControl>
          <FormLabel fontSize={'3xl'}>Session ID: {sessionID}</FormLabel>
          <Input
            type="text"
            value={sessionID}
            onChange={(e) => setSessionID(e.target.value)}
          />
          <Button mt={4} onClick={handleJoinSession}>
            Join Session
          </Button>
        </FormControl>
      </Box>
    </VStack>
  );
};

export default JoinSession;