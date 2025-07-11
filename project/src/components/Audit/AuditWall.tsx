import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { 
  Award, 
  CheckCircle, 
  Calendar, 
  User, 
  MapPin,
  Filter,
  TrendingUp,
  Clock
} from 'lucide-react';

const AuditWall: React.FC = () => {
  const { t } = useTranslation();
  const [filter, setFilter] = useState({ district: 'all', timeframe: 'today', serviceType: 'all' });

  // Mock data
  const recentApprovals = [
    {
      id: 'APP001',
      applicantName: 'John Doe',
      certificateType: 'Income Certificate',
      officerName: 'Officer Smith',
      district: 'Mumbai',
      approvedAt: '2024-01-15T10:30:00',
      processingTime: '2 days'
    },
    {
      id: 'APP002',
      applicantName: 'Jane Smith',
      certificateType: 'Caste Certificate',
      officerName: 'Officer Johnson',
      district: 'Delhi',
      approvedAt: '2024-01-15T09:45:00',
      processingTime: '3 days'
    },
    {
      id: 'APP003',
      applicantName: 'Bob Johnson',
      certificateType: 'Birth Certificate',
      officerName: 'Officer Brown',
      district: 'Bangalore',
      approvedAt: '2024-01-15T08:20:00',
      processingTime: '1 day'
    },
    {
      id: 'APP004',
      applicantName: 'Alice Davis',
      certificateType: 'Residence Certificate',
      officerName: 'Officer Wilson',
      district: 'Chennai',
      approvedAt: '2024-01-15T07:15:00',
      processingTime: '4 days'
    }
  ];

  const efficientOfficers = [
    { name: 'Officer Smith', resolvedCases: 45, avgTime: '2.3 days', district: 'Mumbai' },
    { name: 'Officer Johnson', resolvedCases: 42, avgTime: '2.1 days', district: 'Delhi' },
    { name: 'Officer Brown', resolvedCases: 38, avgTime: '1.8 days', district: 'Bangalore' },
    { name: 'Officer Wilson', resolvedCases: 35, avgTime: '2.5 days', district: 'Chennai' }
  ];

  const stats = {
    todayApprovals: 28,
    weeklyApprovals: 156,
    monthlyApprovals: 645,
    avgProcessingTime: '2.4 days'
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: true 
    });
  };

  const getCertificateIcon = (type: string) => {
    switch (type) {
      case 'Income Certificate': return '💰';
      case 'Caste Certificate': return '📜';
      case 'Birth Certificate': return '👶';
      case 'Residence Certificate': return '🏠';
      default: return '📄';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">{t('audit.title')}</h1>
          <p className="text-gray-600 mt-2">{t('audit.subtitle')}</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <motion.div
            whileHover={{ scale: 1.02 }}
            className="bg-white p-6 rounded-lg shadow-lg"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Today's Approvals</p>
                <p className="text-3xl font-bold text-green-600">{stats.todayApprovals}</p>
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
                <p className="text-sm font-medium text-gray-600">Weekly Approvals</p>
                <p className="text-3xl font-bold text-blue-600">{stats.weeklyApprovals}</p>
              </div>
              <TrendingUp className="w-12 h-12 text-blue-600" />
            </div>
          </motion.div>

          <motion.div
            whileHover={{ scale: 1.02 }}
            className="bg-white p-6 rounded-lg shadow-lg"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Monthly Approvals</p>
                <p className="text-3xl font-bold text-purple-600">{stats.monthlyApprovals}</p>
              </div>
              <Calendar className="w-12 h-12 text-purple-600" />
            </div>
          </motion.div>

          <motion.div
            whileHover={{ scale: 1.02 }}
            className="bg-white p-6 rounded-lg shadow-lg"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Avg Processing Time</p>
                <p className="text-3xl font-bold text-orange-600">{stats.avgProcessingTime}</p>
              </div>
              <Clock className="w-12 h-12 text-orange-600" />
            </div>
          </motion.div>
        </div>

        {/* Filters */}
        <div className="bg-white p-6 rounded-lg shadow-lg mb-6">
          <div className="flex flex-col md:flex-row gap-4 items-center">
            <div className="flex items-center space-x-2">
              <Filter className="w-5 h-5 text-gray-400" />
              <span className="text-sm font-medium text-gray-700">{t('common.filter')}:</span>
            </div>
            
            <div className="flex gap-4">
              <select
                value={filter.district}
                onChange={(e) => setFilter({ ...filter, district: e.target.value })}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Districts</option>
                <option value="mumbai">Mumbai</option>
                <option value="delhi">Delhi</option>
                <option value="bangalore">Bangalore</option>
                <option value="chennai">Chennai</option>
              </select>
              
              <select
                value={filter.timeframe}
                onChange={(e) => setFilter({ ...filter, timeframe: e.target.value })}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="today">Today</option>
                <option value="week">This Week</option>
                <option value="month">This Month</option>
              </select>
              
              <select
                value={filter.serviceType}
                onChange={(e) => setFilter({ ...filter, serviceType: e.target.value })}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Services</option>
                <option value="income">Income Certificate</option>
                <option value="caste">Caste Certificate</option>
                <option value="birth">Birth Certificate</option>
                <option value="residence">Residence Certificate</option>
              </select>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Recent Approvals */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-6">{t('audit.recentApprovals')}</h3>
              <div className="space-y-4">
                {recentApprovals.map((approval) => (
                  <motion.div
                    key={approval.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="border-l-4 border-green-500 bg-green-50 p-4 rounded-r-lg"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="text-2xl">{getCertificateIcon(approval.certificateType)}</div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            {approval.certificateType} {t('audit.certificateApproved')}
                          </p>
                          <p className="text-xs text-gray-600">
                            {approval.applicantName} • {t('audit.by')} {approval.officerName}
                          </p>
                          <div className="flex items-center space-x-4 mt-2">
                            <div className="flex items-center space-x-1">
                              <MapPin className="w-3 h-3 text-gray-400" />
                              <span className="text-xs text-gray-500">{approval.district}</span>
                            </div>
                            <div className="flex items-center space-x-1">
                              <Clock className="w-3 h-3 text-gray-400" />
                              <span className="text-xs text-gray-500">{approval.processingTime}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-gray-500">{formatTime(approval.approvedAt)}</p>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>

          {/* Efficient Officers */}
          <div>
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-6">{t('audit.efficientOfficers')}</h3>
              <div className="space-y-4">
                {efficientOfficers.map((officer, index) => (
                  <motion.div
                    key={officer.name}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="flex items-center space-x-3 p-3 bg-blue-50 rounded-lg"
                  >
                    <div className="bg-blue-600 text-white rounded-full p-2">
                      <Award className="w-4 h-4" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">{officer.name}</p>
                      <p className="text-xs text-gray-600">{officer.district}</p>
                      <div className="flex items-center space-x-4 mt-1">
                        <span className="text-xs text-blue-600 font-medium">
                          {officer.resolvedCases} cases
                        </span>
                        <span className="text-xs text-gray-500">
                          {officer.avgTime} avg
                        </span>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Live Stats */}
            <div className="bg-white rounded-lg shadow-lg p-6 mt-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Live Statistics</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Applications Today</span>
                  <span className="text-sm font-medium text-green-600">+{stats.todayApprovals}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Processing Rate</span>
                  <span className="text-sm font-medium text-blue-600">94%</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Avg Response Time</span>
                  <span className="text-sm font-medium text-purple-600">{stats.avgProcessingTime}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuditWall;