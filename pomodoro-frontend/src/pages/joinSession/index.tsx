import React, { useState } from 'react';
import { Box, Button, FormControl, FormLabel, Input } from '@chakra-ui/react';
import { useRouter } from 'next/router';

const JoinSession: React.FC = () => {
  const [sessionID, setSessionID] = useState('');
  const router = useRouter();

  const handleJoinSession = () => {
    router.push(`/pomodoro?sessionID=${sessionID}`);
  };

  return (
    <Box>
      <FormControl>
        <FormLabel>Session ID</FormLabel>
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
  );
};

export default JoinSession;
