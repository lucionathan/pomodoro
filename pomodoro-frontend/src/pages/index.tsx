import React, { useState, useEffect, useContext } from 'react';
import { NextPage } from 'next';
import Link from 'next/link';
import { auth } from '../../config/firebaseConfig';
import Pomodoro from './pomodoro';
import withAuth from './withAuth';
import SessionOptions from '@/components/sessionOptions';
const Home: NextPage = () => {
  return (
    <div>
      {/* <Pomodoro/> */}
      <SessionOptions/>
    </div>

  );
};

export default withAuth(Home);