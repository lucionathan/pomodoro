import React, { useState } from 'react';
import { useRouter } from 'next/router';
import { Box, Button, VStack, Flex, Text, Switch, FormControl, FormLabel, Input } from '@chakra-ui/react';

const CreateSession: React.FC = () => {
  const router = useRouter();
  const [isPublic, setIsPublic] = useState(true);
  const [name, setName] = useState("");

  const handleCreateSession = () => {
    router.push(`/pomodoro?createSession=true&isPublic=${isPublic}`);
  };

  return (
    <VStack spacing={4}>
      <Box>
        <FormControl>
          <Flex alignItems="center" justifyContent="space-between">
            <FormLabel fontSize={'lg'} htmlFor="is-public" mb="0">
              Is the session public?
            </FormLabel>
            <Switch colorScheme="red"
              id="is-public"
              isChecked={isPublic}
              onChange={(e) => setIsPublic(e.target.checked)}
            />
          </Flex>

          <Flex alignItems="center" justifyContent="space-between" mt={9} mb={5}>
            <FormLabel fontSize={'lg'}>Name</FormLabel>
            <Input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </Flex>
        </FormControl>
      </Box>
      <Button onClick={handleCreateSession}>
        Create Session
      </Button>
    </VStack>
  );
};

export default CreateSession;