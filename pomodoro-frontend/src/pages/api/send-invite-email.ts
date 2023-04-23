import type { NextApiRequest, NextApiResponse } from 'next';
import nodemailer from 'nodemailer';

const my_email = "myemail@email.com"
const my_password = "mypassword"

const transporter = nodemailer.createTransport({
  service: 'gmail', // Or use another email service
  auth: {
    user: my_email,
    pass: my_password,
  },
});

export default async (req: NextApiRequest, res: NextApiResponse) => {
  const { friendEmail, sessionID } = req.body;

  if (req.method === 'POST') {
    const inviteURL = `${req.headers.origin}/join-session?sessionID=${sessionID}`;
  
    const mailOptions = {
      from: my_email,
      to: friendEmail,
      subject: 'Join My Pomodoro Session',
      text: `Hey! I would like to invite you to join my Pomodoro session. Click the link below to join:\n\n${inviteURL}`,
    };
  
    try {
      await transporter.sendMail(mailOptions);
      res.status(200).json({ message: 'Email sent successfully!' });
    } catch (error) {
      res.status(500).json({ message: 'Error sending email', error });
    }
  } else {
    res.status(405).json({ message: 'Method not allowed' });
  }
};