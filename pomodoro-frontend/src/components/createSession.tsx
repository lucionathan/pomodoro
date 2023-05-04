import React, { useState } from 'react';
import { useRouter } from 'next/router';
import { Box, Button, VStack, Flex, Text, Switch, FormControl, FormLabel } from '@chakra-ui/react';

const CreateSession: React.FC = () => {
  const router = useRouter();
  const [isPublic, setIsPublic] = useState(true);

  const handleCreateSession = () => {
    router.push(`/pomodoro?createSession=true&isPublic=${isPublic}`);
  };

  return (
    <VStack spacing={4}>
      <Box>
        <FormControl display="flex" alignItems="center">
          <FormLabel htmlFor="is-public" mb="0">
            Is the session public?
          </FormLabel>
          <Switch
            id="is-public"
            isChecked={isPublic}
            onChange={(e) => setIsPublic(e.target.checked)}
          />
        </FormControl>
      </Box>
      <Button onClick={handleCreateSession}>
        Create Session
      </Button>
    </VStack>
  );
};

export default CreateSession;