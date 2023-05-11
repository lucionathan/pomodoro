import React, { useState, useEffect, useContext } from 'react';
import { NextPage } from 'next';
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