import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { 
  FileText, 
  CheckCircle, 
  XCircle, 
  Clock, 
  Search,
  Filter,
  User,
  Calendar,
  AlertCircle,
  ArrowLeft
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Application } from '../../types';
import PendingApplications from './PendingApplications';
import ReviewApplication from './ReviewApplication';

const OfficerDashboard: React.FC = () => {
  const { t } = useTranslation();
  const [filter, setFilter] = useState({ district: 'all', status: 'all' });
  const [searchQuery, setSearchQuery] = useState('');
  const [currentView, setCurrentView] = useState<'dashboard' | 'pending' | 'review'>('dashboard');
  const [selectedApplication, setSelectedApplication] = useState<Application | null>(null);

  // Mock data
  const stats = {
    total: 245,
    pending: 87,
    approved: 132,
    rejected: 26
  };

  const chartData = [
    { name: 'Pending', value: 87, color: '#f59e0b' },
    { name: 'Approved', value: 132, color: '#10b981' },
    { name: 'Rejected', value: 26, color: '#ef4444' }
  ];

  const monthlyData = [
    { month: 'Jan', applications: 65 },
    { month: 'Feb', applications: 78 },
    { month: 'Mar', applications: 89 },
    { month: 'Apr', applications: 92 },
    { month: 'May', applications: 105 },
    { month: 'Jun', applications: 118 }
  ];

  const applications = [
    {
      id: 'APP001',
      applicant: 'John Doe',
      type: 'Income Certificate',
      district: 'Mumbai',
      submittedAt: '2024-01-15',
      status: 'pending'
    },
    {
      id: 'APP002',
      applicant: 'Jane Smith',
      type: 'Caste Certificate',
      district: 'Delhi',
      submittedAt: '2024-01-14',
      status: 'under_review'
    },
    {
      id: 'APP003',
      applicant: 'Bob Johnson',
      type: 'Birth Certificate',
      district: 'Bangalore',
      submittedAt: '2024-01-13',
      status: 'approved'
    }
  ];

  const handleAction = (applicationId: string, action: string) => {
    console.log(`Action: ${action} for application: ${applicationId}`);
    // Handle application action
  };

  const handleViewApplication = (application: Application) => {
    setSelectedApplication(application);
    setCurrentView('review');
  };

  const handleStatusUpdate = (applicationId: string, status: string, reason?: string) => {
    console.log(`Application ${applicationId} updated to ${status}`, reason);
    // Handle status update - would typically make API call here
    // For demo, we'll just go back to pending applications
    setCurrentView('pending');
  };

  const handleBackToDashboard = () => {
    setCurrentView('dashboard');
    setSelectedApplication(null);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'under_review': return 'bg-blue-100 text-blue-800';
      case 'approved': return 'bg-green-100 text-green-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return <Clock className="w-4 h-4" />;
      case 'under_review': return <AlertCircle className="w-4 h-4" />;
      case 'approved': return <CheckCircle className="w-4 h-4" />;
      case 'rejected': return <XCircle className="w-4 h-4" />;
      default: return <FileText className="w-4 h-4" />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            {currentView !== 'dashboard' && (
              <button
                onClick={handleBackToDashboard}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors duration-200"
              >
                <ArrowLeft className="w-6 h-6 text-gray-600" />
              </button>
            )}
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{t('dashboard.title')}</h1>
              <p className="text-gray-600 mt-2">Manage and track certificate applications</p>
            </div>
          </div>
          
          {currentView === 'dashboard' && (
            <div className="flex space-x-3">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setCurrentView('pending')}
                className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors duration-200 flex items-center space-x-2"
              >
                <Clock className="w-5 h-5" />
                <span>View Pending Applications</span>
              </motion.button>
            </div>
          )}
        </div>

        {currentView === 'dashboard' && (
          <>
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              <motion.div
                whileHover={{ scale: 1.02 }}
                className="bg-white p-6 rounded-lg shadow-lg"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">{t('dashboard.totalApplications')}</p>
                    <p className="text-3xl font-bold text-gray-900">{stats.total}</p>
                  </div>
                  <FileText className="w-12 h-12 text-blue-600" />
                </div>
              </motion.div>

              <motion.div
                whileHover={{ scale: 1.02 }}
                className="bg-white p-6 rounded-lg shadow-lg"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">{t('dashboard.pending')}</p>
                    <p className="text-3xl font-bold text-yellow-600">{stats.pending}</p>
                  </div>
                  <Clock className="w-12 h-12 text-yellow-600" />
                </div>
              </motion.div>

              <motion.div
                whileHover={{ scale: 1.02 }}
                className="bg-white p-6 rounded-lg shadow-lg"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">{t('dashboard.approved')}</p>
                    <p className="text-3xl font-bold text-green-600">{stats.approved}</p>
                  </div>
                  <CheckCircle className="w-12 h-12 text-green-600" />
                </div>
              </motion.div>

              <motion.div
                whileHover={{ scale: 1.02 }}
                className="bg-white p-6 rounded-lg shadow-lg"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">{t('dashboard.rejected')}</p>
                    <p className="text-3xl font-bold text-red-600">{stats.rejected}</p>
                  </div>
                  <XCircle className="w-12 h-12 text-red-600" />
                </div>
              </motion.div>
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              <div className="bg-white p-6 rounded-lg shadow-lg">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Status Distribution</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={chartData}
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    >
                      {chartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              <div className="bg-white p-6 rounded-lg shadow-lg">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Monthly Applications</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={monthlyData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="applications" fill="#3b82f6" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="bg-white p-6 rounded-lg shadow-lg">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    <span className="text-sm text-gray-900">3 applications approved today</span>
                  </div>
                  <span className="text-xs text-gray-500">2 hours ago</span>
                </div>
                
                <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <Clock className="w-5 h-5 text-blue-600" />
                    <span className="text-sm text-gray-900">5 new applications received</span>
                  </div>
                  <span className="text-xs text-gray-500">4 hours ago</span>
                </div>
                
                <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <AlertCircle className="w-5 h-5 text-yellow-600" />
                    <span className="text-sm text-gray-900">2 applications need attention</span>
                  </div>
                  <span className="text-xs text-gray-500">6 hours ago</span>
                </div>
              </div>
            </div>
          </>
        )}

        {currentView === 'pending' && (
          <PendingApplications onViewApplication={handleViewApplication} />
        )}

        {currentView === 'review' && selectedApplication && (
          <ReviewApplication
            application={selectedApplication}
            onBack={() => setCurrentView('pending')}
            onStatusUpdate={handleStatusUpdate}
          />
        )}
      </div>
    </div>
  );
};

export default OfficerDashboard;