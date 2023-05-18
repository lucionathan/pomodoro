import React, { useEffect, useState } from 'react';
import { Box, Button, Flex, Heading, Link } from '@chakra-ui/react';
import { useRouter } from 'next/router';
import { User } from 'firebase/auth';
import { auth } from '../../config/firebaseConfig';

const Header: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((currentUser) => {
      setUser(currentUser as User);
    });

    return () => {
      unsubscribe();
    };
  }, []);

  const handleLogout = async () => {
    try {
      await auth.signOut();
      router.push('/login');
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  return (
    <Box bg="red.100" height="7vh" color="white">
      <Flex align="center" direction="row" height="7vh" mx={6}>
        <Box>
          {user && (
            <Button onClick={handleLogout} variant="outline" borderColor="white" color="white"
            bg={'red.800'}
            _hover={{ 
              backgroundColor: "red.600", 
              color: "white" 
            }}
            >
              Log out
            </Button>
          )}
        </Box>
        <Box position="absolute" left="50%" transform="translateX(-50%)">
          <Link onClick={() => router.push('/')}>
            <Heading color="black" as="h1" size="lg" fontFamily="'Roboto', sans-serif">
              PomoSync
            </Heading>
          </Link>
        </Box>
      </Flex>
    </Box>
  );
};

export default Header;
