import React from 'react';
import { Link } from 'react-router-dom';

function LoginButton() {
  return (
    <Link to="/register">
      <button type="button">Login</button>
    </Link>
  );
}

export default LoginButton;
