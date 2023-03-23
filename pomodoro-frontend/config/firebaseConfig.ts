import firebase from 'firebase/compat/app';
import 'firebase/compat/auth';
import 'firebase/compat/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyAZ0E34CG4XGkRCYfxJklxFsida__JM_DQ",
  authDomain: "pomodoro-6debe.firebaseapp.com",
  projectId: "pomodoro-6debe",
  storageBucket: "pomodoro-6debe.appspot.com",
  messagingSenderId: "411437237881",
  appId: "1:411437237881:web:27038dd33b381f903ef6a8",
  measurementId: "G-Q2QQX3GBPY"
};

const app = firebase.initializeApp(firebaseConfig);

export const auth = app.auth();