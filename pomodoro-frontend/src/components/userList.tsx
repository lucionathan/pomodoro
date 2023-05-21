import React, { useEffect, useState } from 'react';
import { Box, VStack, Heading, Text } from "@chakra-ui/react";

interface UserListProps {
  ws: WebSocket | null;
  sessionID: string;
}

const UserList: React.FC<UserListProps> = ({ ws, sessionID }) => {
  const [users, setUsers] = useState<string[]>([]);

  const fetchUsers = async () => {
    const res = await fetch(`http://localhost:8080/usernames/${sessionID}`);
    const data = await res.json();
    setUsers(data);
  }

  const handleMessage = async (event: MessageEvent) => {
    const message = JSON.parse(event.data);
    console.log(message);

    if (message.action === 'userJoined' || message.action === 'userLeft') {
        fetchUsers();
    }
  };

  useEffect(() => {
    if (!ws) return;

    ws.addEventListener('message', handleMessage);

    return () => {
      ws.removeEventListener('message', handleMessage);
    };
  }, [ws]);

  return (
    <Box bg={'red.900'} borderRadius={'lg'} p={5} minH="50vh" maxW="25vh">
      <VStack spacing={4} w="100%">
        <Heading fontSize="3xl" color={"white"}>User List</Heading>
        {users.map((user, i) => (
          <Text key={i} fontSize="2xl" color={"white"}>{user}</Text>
        ))}
      </VStack>
    </Box>
  );
};

export default UserList;