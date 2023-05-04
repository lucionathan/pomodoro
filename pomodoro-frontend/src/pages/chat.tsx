import React, { useState, useEffect, useRef } from 'react';
import { VStack, Input, Button, Box, Text } from '@chakra-ui/react';

interface ChatProps {
  ws: WebSocket | null;
}

const Chat: React.FC<ChatProps> = ({ ws }) => {
  const [messages, setMessages] = useState<string[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const messageRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!ws) return;

    const handleMessage = (event: MessageEvent) => {
      const message = JSON.parse(event.data);

      if (message.action === 'chat') {
        setMessages((prevMessages) => [...prevMessages, message.data]);
      }
    };

    ws.addEventListener('message', handleMessage);
    return () => {
      ws.removeEventListener('message', handleMessage);
    };
  }, [ws]);

  useEffect(() => {
    if (messageRef.current) {
      messageRef.current.scrollTop = messageRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSendMessage = () => {
    if (!ws) return;

    const message = {
      action: 'chat',
      data: inputMessage,
    };
    ws.send(JSON.stringify(message));
    setInputMessage('');
  };

  return (
    <VStack spacing={4} alignItems="stretch" width="100%">
      <Box
        ref={messageRef}
        height="300px"
        overflowY="auto"
        border="1px solid"
        borderColor="gray.300"
        borderRadius="md"
        p={2}
      >
        {messages.map((message, index) => (
          <Text key={index}>{message}</Text>
        ))}
      </Box>
      <Input
        value={inputMessage}
        onChange={(e) => setInputMessage(e.target.value)}
        placeholder="Type your message"
      />
      <Button onClick={handleSendMessage} width="100%">
        Send
      </Button>
    </VStack>
  );
};

export default Chat;
