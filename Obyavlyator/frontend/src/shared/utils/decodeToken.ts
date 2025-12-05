import { jwtDecode } from 'jwt-decode';

interface DecodedToken {
  email?: string;
  name?: string;
  given_name?: string;
  family_name?: string;
  sub?: string;
  exp?: number;
}

export const decodeToken = (token: string): DecodedToken | null => {
  try {
    return jwtDecode<DecodedToken>(token);
  } catch (error) {
    console.error('Failed to decode token:', error);
    return null;
  }
};

export const extractUserFromToken = (token: string) => {
  const decoded = decodeToken(token);
  
  if (!decoded) return null;

  return {
    email: decoded.email || '',
    first_name: decoded.given_name || decoded.name?.split(' ')[0] || '',
    last_name: decoded.family_name || decoded.name?.split(' ')[1] || '',
  };
};
