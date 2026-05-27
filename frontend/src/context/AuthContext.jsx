import { createContext, useState } from 'react';
import api from '../utils/api';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {

  const [user, setUser] = useState(null);

  const login = async (email, password) => {

    const response = await api.post('/auth/login', {
      email,
      password
    });

    localStorage.setItem('token', response.data.token);

    setUser(response.data.user);

    return response.data.user;
  };

  const logout = () => {

    localStorage.removeItem('token');

    setUser(null);
  };

  return (
    <AuthContext.Provider value={{
      user,
      login,
      logout
    }}>
      {children}
    </AuthContext.Provider>
  );
};