import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import LoginOptions from './LoginOptions';
import UserLogin from './UserLogin';
import OfficerLogin from './OfficerLogin';

const LoginPage: React.FC = () => {
  const [loginType, setLoginType] = useState<'options' | 'user' | 'officer'>('options');
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleLogin = (userData: any) => {
    login(userData);
    if (userData.role === 'officer') {
      navigate('/dashboard');
    } else {
      navigate('/');
    }
  };

  const renderLogin = () => {
    switch (loginType) {
      case 'user':
        return (
          <UserLogin
            onBack={() => setLoginType('options')}
            onLogin={handleLogin}
          />
        );
      case 'officer':
        return (
          <OfficerLogin
            onBack={() => setLoginType('options')}
            onLogin={handleLogin}
          />
        );
      default:
        return (
          <LoginOptions
            onUserLogin={() => setLoginType('user')}
            onOfficerLogin={() => setLoginType('officer')}
          />
        );
    }
  };

  return renderLogin();
};

export default LoginPage;