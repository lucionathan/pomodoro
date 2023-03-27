import React, { useState, useEffect, useContext } from 'react';
import { NextPage } from 'next';
import Link from 'next/link';
import { auth } from '../../config/firebaseConfig';
import Pomodoro from './pomodoro';

const Home: NextPage = () => {
  return (
    <div>
      <Pomodoro/>
    </div>
    // <div style={{ paddingTop: '50px' }}>

    //   {/* <div className={(styles.flexContainer, styles.description)}> */}
    //     <h2>Já tem uma conta?</h2>
    //     <Link href='/login'>
    //       <a>Entrar</a>
    //     </Link>
    //   {/* </div> */}

    //   {/* <div className={(styles.flexContainer, styles.description)}> */}
    //     <h2>Não tem uma conta?</h2>
    //     <Link href='/register'>
    //       <a>Registrar</a>
    //     </Link>
    //   {/* </div> */}
    // </div>
  );
};

export default Home;