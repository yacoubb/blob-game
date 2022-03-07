import React from 'react';
import { useAuth } from '../hooks';
import Button from './Button';

function LoginButton() {
  const { logout } = useAuth();
  return (
    <Button color="blue" onClick={logout}>
      Logout
    </Button>
  );
}

export default LoginButton;
