import React from 'react';
import { useRouter } from 'next/router';
import { Box, Button, VStack, Flex } from '@chakra-ui/react';
import JoinSession from '@/pages/joinSession';
import PublicSessions from '@/pages/publicSessions';
import CreateSession from './createSession';

const SessionOptions: React.FC = () => {
  
  return (
    <Flex alignItems="start" justifyContent="center" minHeight="100vh">
      <Box spacing={5} p={5} borderWidth={1} mt={10} borderRadius="md" boxShadow="md">
        <CreateSession />
      </Box>

      <Box spacing={5} p={5} borderWidth={1} ml={10} mt={10} borderRadius="md" boxShadow="md">
        <JoinSession />
      </Box>

      <Box ml={10} mt={10}>
        <PublicSessions />
      </Box>
    </Flex>
  );
};

export default SessionOptions;
