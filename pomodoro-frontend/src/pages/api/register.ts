import { NextApiRequest, NextApiResponse } from 'next';
import axios from 'axios';

const register = async (req: NextApiRequest, res: NextApiResponse) => {
  if (req.method === 'POST') {
    const { userID, email } = req.body;

    const userData = {
      email,
    };

    try {
      // Replace 'http://localhost:8080' with your Go backend URL if different
      const response = await axios.post('http://localhost:8080/createUser', {
        userID
      });

      if (response.status === 200) {
        res.status(200).json({ message: 'User registered successfully' });
      } else {
        res.status(500).json({ message: 'Failed to register user' });
      }
    } catch (error) {
      console.error('Error registering:', error);
      res.status(500).json({ message: 'Failed to register user' });
    }
  } else {
    res.status(405).json({ message: 'Method not allowed' });
  }
};

export default register;