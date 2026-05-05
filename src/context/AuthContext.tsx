import React, { createContext, useContext, useState, useEffect } from 'react';
import { login as apiLogin, register as apiRegister } from '../api/client';

interface AuthContextType {
  token:   string | null;
  apiKey:  string | null;
  tenant:  any;
  login:   (email: string, password: string) => Promise<void>;
  register:(email: string, password: string, name: string) => Promise<void>;
  logout:  () => void;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [token,  setToken]  = useState(localStorage.getItem('token'));
  const [apiKey, setApiKey] = useState(localStorage.getItem('api_key'));
  const [tenant, setTenant] = useState(() => {
    const t = localStorage.getItem('tenant');
    return t ? JSON.parse(t) : null;
  });

  const login = async (email: string, password: string) => {
    const res = await apiLogin(email, password);
    const { token, api_key, tenant } = res.data;
    localStorage.setItem('token',   token);
    localStorage.setItem('api_key', api_key);
    localStorage.setItem('tenant',  JSON.stringify(tenant));
    setToken(token); setApiKey(api_key); setTenant(tenant);
  };

  const register = async (email: string, password: string, name: string) => {
    const res = await apiRegister(email, password, name);
    const { token, api_key, tenant } = res.data;
    localStorage.setItem('token',   token);
    localStorage.setItem('api_key', api_key);
    localStorage.setItem('tenant',  JSON.stringify(tenant));
    setToken(token); setApiKey(api_key); setTenant(tenant);
  };

  const logout = () => {
    localStorage.clear();
    setToken(null); setApiKey(null); setTenant(null);
  };

  return (
    <AuthContext.Provider value={{ token, apiKey, tenant, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
