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
  useToast,
} from "@chakra-ui/react";

const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const router = useRouter();
  const toast = useToast();

  const isFormValid = () => {
    if (!email || !password) {
      toast({
        title: "Error",
        description: "All fields are required.",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
      return false;
    }

    return true;
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!isFormValid()) {
      return;
    }

    try {
      await auth.signInWithEmailAndPassword(email, password);
      router.push('/');
    } catch (error) {
      console.error('Error signing in:', error);
    }
  };

  return (
    <Center h="100vh">
      <Box>
        <form onSubmit={handleSubmit}>
          <FormControl maxW="xs" minW="md" minH="300px" mt={8} border="1px" borderRadius="md" p={4} boxShadow="lg">
            <Text fontSize="4xl" fontWeight="bold" mb={4} textAlign="center">Login</Text>
            <Flex flexDirection="column">
              <Input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                mb={4}
                size="sm"
                fontSize="xl"
                isRequired
              />
              <Input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                mb={4}
                size="sm"
                fontSize="xl"
                isRequired
              />
            </Flex>
            <Button mb={2} w="full" type="submit">Login</Button>
            <Button w="full" variant="outline" onClick={() => router.push("/register")}>Register</Button>
          </FormControl>
        </form>
      </Box>
    </Center>
  );
};

export default Login;