import React, { useEffect } from 'react';
import { useRouter } from 'next/router';
import { auth } from '../../config/firebaseConfig';

const withAuth = (WrappedComponent: React.ComponentType) => {
  const Wrapper: React.FC = (props) => {
    const router = useRouter();

    useEffect(() => {
      const unsubscribe = auth.onAuthStateChanged((user) => {
        if (!user) {
          router.push('/login');
        }
      });

      return () => {
        unsubscribe();
      };
    }, [router]);

    return <WrappedComponent {...props} />;
  };

  return Wrapper;
};

export default withAuth;