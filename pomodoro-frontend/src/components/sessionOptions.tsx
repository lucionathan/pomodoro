import React, { useState } from 'react';
import { Box, Button, VStack, Flex, Collapse, Stack, useBreakpointValue, Text } from '@chakra-ui/react';
import JoinSession from '@/pages/joinSession';
import PublicSessions from '@/pages/publicSessions';
import CreateSession from './createSession';

const SessionOptions: React.FC = () => {
  const [show, setShow] = useState('');

  const toggleShow = (option: string) => {
    if (show === option) {
      setShow('');
    } else {
      setShow(option);
    }
  };

  const buttonWidth = useBreakpointValue({ base: "85%", md: "65%", lg: "45%", xl: "35%" });

  return (
    <Flex justifyContent="center" alignItems="center" height="100vh">
      <Box bg={'red.900'} borderRadius={'lg'} p={5} w={buttonWidth} minH="50vh" alignContent={"center"}>
        <VStack spacing={4} w="100%">

          <Text color={"white"} fontWeight={'bold'} fontSize={'5xl'} mt={'20'} mb={'10'}>PomoSync</Text>

          <Stack spacing={0} w={buttonWidth}>
            <Button bg={'red.100'} w="100%" onClick={() => toggleShow('create')}>
              Create Session
            </Button>

            <Collapse in={show === 'create'} animateOpacity>
              <Box bg={'red.700'} borderRadius={'lg'} p={3} w="100%">
                <CreateSession />
              </Box>
            </Collapse>
          </Stack>

          <Stack spacing={0} w={buttonWidth}>
            <Button bg={'red.100'} w="100%" onClick={() => toggleShow('join')}>
              Join Session
            </Button>
            <Collapse in={show === 'join'} animateOpacity>
              <Box bg={'red.700'} borderRadius={'lg'} p={3} w="100%">
                <JoinSession />
              </Box>
            </Collapse>
          </Stack>

          <Stack spacing={0} w={buttonWidth}>
            <Button bg={'red.100'} w="100%" onClick={() => toggleShow('public')}>
              Public Sessions
            </Button>
            <Collapse in={show === 'public'} animateOpacity>
              <Box bg={'red.700'} borderRadius={'lg'} p={3} w="100%">
                <PublicSessions />
              </Box>
            </Collapse>
          </Stack>

        </VStack>
      </Box>
    </Flex>
  );
};

export default SessionOptions;
