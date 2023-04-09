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

const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const router = useRouter(); // Add this line

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    try {
      await auth.signInWithEmailAndPassword(email, password);
      router.push('/'); // Add this line to redirect to the home page
    } catch (error) {
      console.error('Error signing in:', error);
    }
  };

  return (
    <Center h="100vh">
  <Box>
    <form onSubmit={handleSubmit}>
      <FormControl maxW="xs" minW="md" minH="300px" mt={8} border="1px">
        <Text fontSize="4xl" fontWeight="bold" m="10px" mt="30px">Login</Text>
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
        <Button m="10px" type="submit">Login</Button>

        <Button onClick={() => router.push("/register")}>Register</Button>

      </FormControl>
    </form>
  </Box>
</Center>

  );
};

export default Login;