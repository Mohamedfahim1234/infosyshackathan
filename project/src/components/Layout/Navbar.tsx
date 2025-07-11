import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { LogOut, Globe, Shield, User } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const Navbar: React.FC = () => {
  const { t, i18n } = useTranslation();
  const { user, logout, isAuthenticated } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const changeLanguage = (lang: string) => {
    i18n.changeLanguage(lang);
    const currentPath = location.pathname;
    const pathWithoutLang = currentPath.replace(/^\/[a-z]{2}/, '');
    navigate(`/${lang}${pathWithoutLang}`);
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const getNavItems = () => {
    if (!isAuthenticated) return [];
    
    if (user?.role === 'officer') {
      return [
        { path: '/dashboard', label: t('nav.dashboard') },
        { path: '/audit', label: t('nav.audit') }
      ];
    }
    
    return [
      { path: '/', label: t('nav.home') },
      { path: '/apply', label: t('nav.apply') },
      { path: '/track', label: t('nav.track') }
    ];
  };

  return (
    <nav className="bg-white shadow-lg border-b border-gray-200">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-3">
            <div className="bg-blue-600 p-2 rounded-lg">
              <Shield className="w-6 h-6 text-white" />
            </div>
            <span className="text-xl font-bold text-gray-800">ServiceTransparency</span>
          </Link>

          {/* Navigation Items */}
          <div className="hidden md:flex items-center space-x-8">
            {getNavItems().map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`text-gray-700 hover:text-blue-600 transition-colors duration-200 ${
                  location.pathname === item.path ? 'text-blue-600 font-semibold' : ''
                }`}
              >
                {item.label}
              </Link>
            ))}
          </div>

          {/* Right Side */}
          <div className="flex items-center space-x-4">
            {/* Language Switcher */}
            <div className="relative group">
              <button className="flex items-center space-x-1 text-gray-700 hover:text-blue-600 transition-colors duration-200">
                <Globe className="w-5 h-5" />
                <span className="text-sm font-medium uppercase">{i18n.language}</span>
              </button>
              <div className="absolute right-0 mt-2 w-32 bg-white rounded-md shadow-lg border border-gray-200 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200">
                <button
                  onClick={() => changeLanguage('en')}
                  className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                >
                  English
                </button>
                <button
                  onClick={() => changeLanguage('hi')}
                  className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                >
                  हिन्दी
                </button>
                <button
                  onClick={() => changeLanguage('ta')}
                  className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                >
                  தமிழ்
                </button>
              </div>
            </div>

            {/* User Menu */}
            {isAuthenticated ? (
              <div className="flex items-center space-x-3">
                <div className="flex items-center space-x-2">
                  <div className="bg-blue-100 p-2 rounded-full">
                    {user?.role === 'officer' ? (
                      <Shield className="w-4 h-4 text-blue-600" />
                    ) : (
                      <User className="w-4 h-4 text-blue-600" />
                    )}
                  </div>
                  <span className="text-sm font-medium text-gray-700">{user?.name}</span>
                </div>
                <button
                  onClick={handleLogout}
                  className="flex items-center space-x-1 text-gray-700 hover:text-red-600 transition-colors duration-200"
                >
                  <LogOut className="w-4 h-4" />
                  <span className="text-sm">{t('nav.logout')}</span>
                </button>
              </div>
            ) : (
              <Link
                to="/login"
                className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors duration-200"
              >
                {t('nav.login')}
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;