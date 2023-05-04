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
    <VStack spacing={4}>
      <Box>
        <FormControl>
          <FormLabel fontSize={'lg'}>Session ID</FormLabel>
          <Input
            type="text"
            value={sessionID}
            onChange={(e) => setSessionID(e.target.value)}
          />
        </FormControl>
      </Box>
      <Button onClick={handleJoinSession}>
        Join Session
      </Button>
    </VStack>
  );
};

export default JoinSession;