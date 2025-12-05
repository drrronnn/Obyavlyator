import { GoogleOAuthProvider } from '@react-oauth/google';
import React from 'react';

interface GoogleAuthProviderWrapperProps {
  children: React.ReactNode;
}

export const GoogleAuthProviderWrapper: React.FC<GoogleAuthProviderWrapperProps> = ({ children }) => {
  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

  if (!clientId) {
    console.error('VITE_GOOGLE_CLIENT_ID не найден в переменных окружения');
    return <>{children}</>;
  }

  return (
    <GoogleOAuthProvider clientId={"65779830421-tmh151idr9smuc5c068ep4s5o5d6aq6n.apps.googleusercontent.com"}>
      {children}
    </GoogleOAuthProvider>
  );
};
