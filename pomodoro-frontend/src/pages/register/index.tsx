import React, { useState } from 'react';
import { useRouter } from 'next/router';
import { auth } from '../../../config/firebaseConfig';
import {
  Box,
  Button,
  Center,
  Flex,
  FormControl,
  FormLabel,
  Input,
  Text,
} from "@chakra-ui/react";
import { RouteHandlerManager } from 'next/dist/server/future/route-handler-managers/route-handler-manager';

const Register: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const router = useRouter(); // Add this line

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    try {
      await auth.createUserWithEmailAndPassword(email, password);
      router.push('/login');
    } catch (error) {
      console.error('Error registering:', error);
    }
  };

  return (
    <Center h="100vh">
      <Box>
        <form onSubmit={handleSubmit}>
          <FormControl maxW="xs" minW="md" minH="300px" mt={8} border="1px">
            <Text fontSize="4xl" fontWeight="bold" m="10px" mt="30px">Register</Text>
            <Flex flexDirection="column">

              <Input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                mb={4}
                size="sm"
                fontSize="xl"
                maxWidth="400px"
                m="10px"
              />
              <Input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                mb={4}
                size="sm"
                fontSize="xl"
                maxWidth="400px"
                m="10px"
              />
            </Flex>
            <Button m="10px" type="submit">Register</Button>
            <Button onClick={() => router.push("/login")}>Login</Button>

          </FormControl>
        </form>
      </Box>
    </Center>
  );
};

export default Register;