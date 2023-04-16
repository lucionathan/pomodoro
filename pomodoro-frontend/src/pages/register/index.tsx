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

const Register: React.FC = () => {
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');

  const router = useRouter();
  const toast = useToast();

  const isFormValid = () => {
    if (!email || !username || !password || !passwordConfirm) {
      toast({
        title: "Error",
        description: "All fields are required.",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
      return false;
    }

    if (password !== passwordConfirm) {
      toast({
        title: "Error",
        description: "Passwords do not match.",
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
      const userCredential = await auth.createUserWithEmailAndPassword(email, password);
      const user = userCredential.user;
  
      if (user) {
        const response = await fetch('/api/register', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ userID: user.uid, email, username }),
        });
  
        if (response.ok) {
          router.push('/');
        } else {
          console.error('Error registering:', response.statusText);
        }
      } else {
        console.error('Error registering: User not created');
      }
    } catch (error) {
      console.error('Error registering:', error);
    }
  };

  return (
    <Center h="100vh">
      <Box>
        <form onSubmit={handleSubmit}>
          <FormControl maxW="xs" minW="md" minH="400px" mt={8} border="1px" borderRadius="md" p={4} boxShadow="lg">
            <Text fontSize="4xl" fontWeight="bold" mb={4} textAlign="center">Register</Text>
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
                type="text"
                placeholder="Username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
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
              <Input
                type="password"
                placeholder="Confirm Password"
                value={passwordConfirm}
                onChange={(e) => setPasswordConfirm(e.target.value)}
                mb={4}
                size="sm"
                fontSize="xl"
                isRequired
              />
            </Flex>
            <Button mb={2} w="full" type="submit">Register</Button>
            <Button w="full" variant="outline" onClick={() => router.push("/login")}>Login</Button>
          </FormControl>
        </form>
      </Box>
    </Center>    
  );
};     

export default Register;

