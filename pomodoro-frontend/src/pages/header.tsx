import React, { useEffect, useState } from 'react';
import { Box, Button, Flex } from '@chakra-ui/react';
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
    <Box bg="teal.400" p={4} color="white">
      <Flex justifyContent="space-between" alignItems="center">
        <Box>
          {/* Add your application logo or title here */}
          <span>Your App</span>
        </Box>
        {user && (
          <Box>
            <Button onClick={handleLogout}>Log out</Button>
          </Box>
        )}
      </Flex>
    </Box>
  );
};

export default Header;