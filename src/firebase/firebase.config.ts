import { initializeApp } from 'firebase/app';

export const firebaseConfig = {
  apiKey: "AIzaSyBWxDddCrvr6qDS_r0EHnNDrmWX1Gj6lwk",
  authDomain: "bus-booking-system-cdf64.firebaseapp.com",
  projectId: "bus-booking-system-cdf64",
  storageBucket: "bus-booking-system-cdf64.firebasestorage.app",
  messagingSenderId: "551651400064",
  appId: "1:551651400064:web:2c26bb23fa0c1331234965"
};

export const firebaseApp = initializeApp(firebaseConfig);