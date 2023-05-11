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
    <Box bg="red.300" p={4} color="white">
      <Flex alignItems="center" w="100%">
        <Box>
          {user && (
            <Button onClick={handleLogout} variant="outline" borderColor="white" color="white">
              Log out
            </Button>
          )}
        </Box>
        <Box position="absolute" left="50%" transform="translateX(-50%)">
          <Link onClick={() => router.push('/')}>
            <Heading as="h1" size="lg" fontFamily="'Roboto', sans-serif">
              Pomosync
            </Heading>
          </Link>
        </Box>
      </Flex>
    </Box>
  );
};

export default Header;
