import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { redirectQueryKey } from '../pages/Register';
import { useAuth } from '../hooks';

const LoggedInRoute: React.FC = () => {
  const { user } = useAuth();
  const location = useLocation();

  if (user === null) {
    if (location.pathname !== '/') {
      return (
        <Navigate to={`/register?${redirectQueryKey}=${location.pathname}`} />
      );
    }
    return <Navigate to="/register" />;
  }

  return <Outlet />;
};

export default LoggedInRoute;
