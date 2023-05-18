import React, { useState } from 'react';
import { useRouter } from 'next/router';
import { auth } from '../../../config/firebaseConfig';
import {
  Box,
  Button,
  Center,
  Flex,
  FormControl,
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
    <Center h="90vh">
      <Box>
        <form onSubmit={handleSubmit}>
          <FormControl maxW="xs" minW="md" minH="360px" mt={8} border="1px" borderRadius="md" p={4} boxShadow="lg" bg="red.900">
            <Text fontSize="4xl" fontWeight="bold" mb={4} color="white" textAlign="center">Login</Text>
            <Flex flexDirection="column">
              <Input
                type="email"
                placeholder="Email"
                _placeholder={{ color: 'white' }}
                color="white" 
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
                _placeholder={{ color: 'white' }}
                color="white" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                mb={4}
                size="sm"
                fontSize="xl"
                isRequired
              />
            </Flex>
            <Button 
              mb={2} 
              w="full" 
              bg={'red.200'}
              _hover={{ 
                backgroundColor: "red.300", 
                color: "black" 
              }}
              type="submit">Login</Button>
            <Flex flexDirection="column" alignItems="center" mt="5">
              <Text color="white" mb="3">Don't have an account?</Text>
              <Button 
                variant="outline" 
                bg={'red.200'}
                _hover={{ 
                    backgroundColor: "red.300", 
                    color: "black" 
                }}
                onClick={() => router.push("/register")}
              >
                  Register
              </Button>
            </Flex>
          </FormControl>
        </form>
      </Box>
    </Center>
  );
};

export default Login;
