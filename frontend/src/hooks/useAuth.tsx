import React from 'react';
import { AuthContext } from '../providers/AuthProvider';

export default function useAuth() {
  return React.useContext(AuthContext);
}
