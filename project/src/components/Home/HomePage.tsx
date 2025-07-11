import React from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { 
  FileText, 
  Search, 
  Shield, 
  Clock, 
  Award, 
  Users,
  ArrowRight,
  CheckCircle,
  Globe
} from 'lucide-react';

const HomePage: React.FC = () => {
  const { t } = useTranslation();

  const features = [
    {
      icon: FileText,
      title: 'Easy Application Process',
      description: 'Simple 4-step process to apply for government certificates'
    },
    {
      icon: Search,
      title: 'Track Your Application',
      description: 'Real-time tracking with QR code and notifications'
    },
    {
      icon: Shield,
      title: 'Secure & Transparent',
      description: 'Government-grade security with public audit trail'
    },
    {
      icon: Clock,
      title: 'Fast Processing',
      description: 'Average processing time of 2-3 days'
    }
  ];

  const stats = [
    { label: 'Applications Processed', value: '25,000+', icon: FileText },
    { label: 'Average Processing Time', value: '2.4 days', icon: Clock },
    { label: 'Success Rate', value: '98.5%', icon: CheckCircle },
    { label: 'Districts Covered', value: '50+', icon: Globe }
  ];

  const services = [
    { name: 'Income Certificate', icon: '💰', description: 'Certificate of annual income' },
    { name: 'Caste Certificate', icon: '📜', description: 'Caste verification document' },
    { name: 'Birth Certificate', icon: '👶', description: 'Official birth registration' },
    { name: 'Residence Certificate', icon: '🏠', description: 'Proof of residence' }
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-blue-600 to-blue-800 text-white py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
            >
              <h1 className="text-4xl md:text-6xl font-bold mb-6">
                Government Services Made Simple
              </h1>
              <p className="text-xl md:text-2xl mb-8 text-blue-100">
                Apply for certificates, track progress, and experience transparent governance
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link
                  to="/apply"
                  className="bg-orange-600 hover:bg-orange-700 text-white px-8 py-4 rounded-lg text-lg font-semibold transition-colors duration-200 flex items-center justify-center space-x-2"
                >
                  <span>Apply Now</span>
                  <ArrowRight className="w-5 h-5" />
                </Link>
                <Link
                  to="/track"
                  className="bg-transparent border-2 border-white hover:bg-white hover:text-blue-600 text-white px-8 py-4 rounded-lg text-lg font-semibold transition-colors duration-200"
                >
                  Track Application
                </Link>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="text-center"
              >
                <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <stat.icon className="w-8 h-8 text-blue-600" />
                </div>
                <h3 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">{stat.value}</h3>
                <p className="text-gray-600">{stat.label}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Available Services
            </h2>
            <p className="text-xl text-gray-600">
              Apply for various government certificates online
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {services.map((service, index) => (
              <motion.div
                key={service.name}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-white p-6 rounded-lg shadow-lg hover:shadow-xl transition-shadow duration-300"
              >
                <div className="text-4xl mb-4 text-center">{service.icon}</div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2 text-center">
                  {service.name}
                </h3>
                <p className="text-gray-600 text-center">{service.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Why Choose ServiceTransparency?
            </h2>
            <p className="text-xl text-gray-600">
              Experience the future of government services
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="text-center"
              >
                <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <feature.icon className="w-8 h-8 text-blue-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">{feature.title}</h3>
                <p className="text-gray-600">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-blue-600 text-white">
        <div className="container mx-auto px-4 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-6">
              Ready to Get Started?
            </h2>
            <p className="text-xl mb-8 text-blue-100">
              Join thousands of citizens who have simplified their government service experience
            </p>
            <Link
              to="/apply"
              className="bg-orange-600 hover:bg-orange-700 text-white px-8 py-4 rounded-lg text-lg font-semibold transition-colors duration-200 inline-flex items-center space-x-2"
            >
              <span>Start Your Application</span>
              <ArrowRight className="w-5 h-5" />
            </Link>
          </motion.div>
        </div>
      </section>
    </div>
  );
};

export default HomePage;