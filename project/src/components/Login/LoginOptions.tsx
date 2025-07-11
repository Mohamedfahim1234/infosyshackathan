import React from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { User, Shield } from 'lucide-react';

interface LoginOptionsProps {
  onUserLogin: () => void;
  onOfficerLogin: () => void;
}

const LoginOptions: React.FC<LoginOptionsProps> = ({ onUserLogin, onOfficerLogin }) => {
  const { t } = useTranslation();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-orange-50 flex items-center justify-center py-12 px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="max-w-md w-full space-y-8"
      >
        <div className="text-center">
          <div className="mx-auto h-16 w-16 bg-blue-600 rounded-full flex items-center justify-center mb-6">
            <Shield className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-3xl font-bold text-gray-900 mb-2">{t('login.title')}</h2>
          <p className="text-gray-600">{t('login.subtitle')}</p>
        </div>

        <div className="space-y-4">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={onUserLogin}
            className="w-full bg-blue-600 text-white py-4 px-6 rounded-lg hover:bg-blue-700 transition-colors duration-200 flex items-center justify-center space-x-3"
          >
            <User className="w-6 h-6" />
            <span className="text-lg font-medium">{t('login.userLogin')}</span>
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={onOfficerLogin}
            className="w-full bg-orange-600 text-white py-4 px-6 rounded-lg hover:bg-orange-700 transition-colors duration-200 flex items-center justify-center space-x-3"
          >
            <Shield className="w-6 h-6" />
            <span className="text-lg font-medium">{t('login.officerLogin')}</span>
          </motion.button>
        </div>
      </motion.div>
    </div>
  );
};

export default LoginOptions;