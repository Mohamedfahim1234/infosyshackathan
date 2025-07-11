import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { 
  Search, 
  QrCode, 
  CheckCircle, 
  Clock, 
  AlertCircle,
  User,
  Calendar,
  MessageSquare,
  Phone,
  Mail
} from 'lucide-react';

const TrackApplication: React.FC = () => {
  const { t } = useTranslation();
  const [applicationId, setApplicationId] = useState('');
  const [trackingResult, setTrackingResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  // Mock tracking data
  const mockTrackingData = {
    id: 'APP001',
    type: 'Income Certificate',
    applicantName: 'John Doe',
    status: 'under_review',
    officer: 'Officer Smith',
    submittedAt: '2024-01-15',
    estimatedDelivery: '2024-01-22',
    timeline: [
      {
        status: 'submitted',
        title: 'Application Submitted',
        description: 'Your application has been received',
        timestamp: '2024-01-15T10:30:00',
        completed: true
      },
      {
        status: 'under_review',
        title: 'Under Review',
        description: 'Application is being reviewed by Officer Smith',
        timestamp: '2024-01-16T09:00:00',
        completed: true
      },
      {
        status: 'approved',
        title: 'Approved',
        description: 'Application approved and certificate generated',
        timestamp: null,
        completed: false
      },
      {
        status: 'delivered',
        title: 'Delivered',
        description: 'Certificate delivered to applicant',
        timestamp: null,
        completed: false
      }
    ],
    notifications: [
      {
        id: 1,
        title: 'Application Submitted',
        message: 'Your application has been successfully submitted',
        timestamp: '2024-01-15T10:30:00',
        type: 'success'
      },
      {
        id: 2,
        title: 'Under Review',
        message: 'Your application is now under review by Officer Smith',
        timestamp: '2024-01-16T09:00:00',
        type: 'info'
      }
    ]
  };

  const handleTrack = async () => {
    setLoading(true);
    // Simulate API call
    setTimeout(() => {
      setLoading(false);
      setTrackingResult(mockTrackingData);
    }, 1000);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'submitted': return 'text-blue-600';
      case 'under_review': return 'text-yellow-600';
      case 'approved': return 'text-green-600';
      case 'rejected': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const getStatusIcon = (status: string, completed: boolean) => {
    if (!completed) return <div className="w-4 h-4 border-2 border-gray-300 rounded-full" />;
    
    switch (status) {
      case 'submitted': return <CheckCircle className="w-4 h-4 text-blue-600" />;
      case 'under_review': return <Clock className="w-4 h-4 text-yellow-600" />;
      case 'approved': return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'rejected': return <AlertCircle className="w-4 h-4 text-red-600" />;
      default: return <div className="w-4 h-4 bg-gray-300 rounded-full" />;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">{t('track.title')}</h1>
          <p className="text-gray-600">{t('track.subtitle')}</p>
        </div>

        {/* Search Form */}
        <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('track.applicationId')}
              </label>
              <input
                type="text"
                value={applicationId}
                onChange={(e) => setApplicationId(e.target.value)}
                placeholder="Enter Application ID (e.g., APP001)"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            
            <div className="flex flex-col md:flex-row gap-4">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleTrack}
                disabled={!applicationId || loading}
                className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
              >
                <Search className="w-5 h-5" />
                <span>{loading ? t('common.loading') : t('track.trackButton')}</span>
              </motion.button>
              
              <button className="bg-gray-100 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-200 transition-colors duration-200 flex items-center space-x-2">
                <QrCode className="w-5 h-5" />
                <span>{t('track.scanQr')}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Tracking Results */}
        {trackingResult && (
          <div className="space-y-6">
            {/* Application Info */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-xl font-semibold text-gray-900">{trackingResult.type}</h3>
                  <p className="text-gray-600">Application ID: {trackingResult.id}</p>
                </div>
                <div className={`px-4 py-2 rounded-full text-sm font-medium ${
                  trackingResult.status === 'under_review' ? 'bg-yellow-100 text-yellow-800' : 'bg-blue-100 text-blue-800'
                }`}>
                  {trackingResult.status.replace('_', ' ').toUpperCase()}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="flex items-center space-x-3">
                  <User className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">Applicant</p>
                    <p className="text-sm text-gray-600">{trackingResult.applicantName}</p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-3">
                  <User className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">{t('track.officer')}</p>
                    <p className="text-sm text-gray-600">{trackingResult.officer}</p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-3">
                  <Calendar className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">Estimated Delivery</p>
                    <p className="text-sm text-gray-600">{trackingResult.estimatedDelivery}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Timeline */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-6">Application Timeline</h3>
              <div className="space-y-6">
                {trackingResult.timeline.map((step: any, index: number) => (
                  <motion.div
                    key={step.status}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="flex items-start space-x-4"
                  >
                    <div className="flex-shrink-0 mt-1">
                      {getStatusIcon(step.status, step.completed)}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <h4 className={`font-medium ${step.completed ? getStatusColor(step.status) : 'text-gray-400'}`}>
                          {step.title}
                        </h4>
                        {step.timestamp && (
                          <span className="text-sm text-gray-500">
                            {formatDate(step.timestamp)}
                          </span>
                        )}
                      </div>
                      <p className={`text-sm ${step.completed ? 'text-gray-600' : 'text-gray-400'}`}>
                        {step.description}
                      </p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Notifications */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900">Notifications</h3>
                <div className="flex space-x-2">
                  <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors duration-200 flex items-center space-x-2">
                    <MessageSquare className="w-4 h-4" />
                    <span>{t('track.resendNotification')}</span>
                  </button>
                </div>
              </div>
              
              <div className="space-y-4">
                {trackingResult.notifications.map((notification: any) => (
                  <div
                    key={notification.id}
                    className={`p-4 rounded-lg border-l-4 ${
                      notification.type === 'success' ? 'bg-green-50 border-green-400' :
                      notification.type === 'info' ? 'bg-blue-50 border-blue-400' :
                      'bg-gray-50 border-gray-400'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium text-gray-900">{notification.title}</h4>
                      <span className="text-sm text-gray-500">
                        {formatDate(notification.timestamp)}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mt-1">{notification.message}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Contact Options */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-6">Need Help?</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <button className="flex items-center space-x-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors duration-200">
                  <Phone className="w-5 h-5 text-green-600" />
                  <div className="text-left">
                    <p className="font-medium text-gray-900">Call Support</p>
                    <p className="text-sm text-gray-600">1800-123-4567</p>
                  </div>
                </button>
                
                <button className="flex items-center space-x-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors duration-200">
                  <Mail className="w-5 h-5 text-blue-600" />
                  <div className="text-left">
                    <p className="font-medium text-gray-900">Email Support</p>
                    <p className="text-sm text-gray-600">support@servicetransparency.gov.in</p>
                  </div>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TrackApplication;