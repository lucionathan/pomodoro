import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { Box, Button, VStack, Flex, Text, Switch, FormControl, FormLabel, Input } from '@chakra-ui/react';

const CreateSession: React.FC = () => {
  const router = useRouter();
  const [isPublic, setIsPublic] = useState(true);
  const [name, setName] = useState("");
  const [criar, setCriar] = useState(0);

  const handleCreateSession = async () => {
    console.log(isPublic)
    router.push({
      pathname: "/pomodoro",
      query: {
        isPublic: isPublic,
      },
    },
    "/pomodoro")
  };

  return (
    <VStack spacing={4}>
      <Box>
        <FormControl>
          <Flex alignItems="center" justifyContent="space-between">
            <FormLabel fontSize={'lg'} htmlFor="is-public" mb="0" mt="5" color={'white'}>
              Public Session
            </FormLabel>
            <Switch colorScheme="red" 
              mt="5"
              id="is-public"
              isChecked={isPublic}
              onChange={(e) => setIsPublic(e.target.checked)}
            />
          </Flex>
        </FormControl>
      </Box>
      <Button onClick={() => handleCreateSession()}>
        Create
      </Button>
    </VStack>
  );
};

export default CreateSession;