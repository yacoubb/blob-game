import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../hooks';
import LogoutButton from './LogoutButton';
import LoginButton from './LoginButton';

function NavBar() {
  const { user } = useAuth();
  return (
    <div id="navbar" className="flex flex-row justify-between mb-4">
      <Link to="/" style={{ color: 'initial', textDecoration: 'none' }}>
        <h1 className="text-3xl">blob-game</h1>
      </Link>
      {user ? (
        <div style={{ textAlign: 'right' }}>
          <h5 className="text-slate-500">Logged in as {user.username}</h5>
          <LogoutButton />
        </div>
      ) : (
        <LoginButton />
      )}
    </div>
  );
}

export default NavBar;
