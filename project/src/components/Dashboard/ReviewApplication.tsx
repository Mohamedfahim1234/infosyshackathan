import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { 
  ArrowLeft, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  Download,
  Eye,
  FileText,
  User,
  Calendar,
  MapPin,
  Phone,
  Mail,
  Send
} from 'lucide-react';
import { Application } from '../../types';

interface ReviewApplicationProps {
  application: Application;
  onBack: () => void;
  onStatusUpdate: (applicationId: string, status: string, reason?: string) => void;
}

const ReviewApplication: React.FC<ReviewApplicationProps> = ({ 
  application, 
  onBack, 
  onStatusUpdate 
}) => {
  const { t } = useTranslation();
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [showRequestInfoModal, setShowRequestInfoModal] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [requestMessage, setRequestMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const getCertificateTypeLabel = (type: string) => {
    switch (type) {
      case 'birth': return 'Birth Certificate';
      case 'income': return 'Income Certificate';
      case 'caste': return 'Caste Certificate';
      case 'residence': return 'Residence Certificate';
      default: return type;
    }
  };

  const handleApprove = async () => {
    setLoading(true);
    // Simulate API call
    setTimeout(() => {
      onStatusUpdate(application.id, 'approved');
      setLoading(false);
    }, 1000);
  };

  const handleReject = async () => {
    if (!rejectReason.trim()) return;
    
    setLoading(true);
    // Simulate API call
    setTimeout(() => {
      onStatusUpdate(application.id, 'rejected', rejectReason);
      setShowRejectModal(false);
      setLoading(false);
    }, 1000);
  };

  const handleRequestInfo = async () => {
    if (!requestMessage.trim()) return;
    
    setLoading(true);
    // Simulate API call
    setTimeout(() => {
      onStatusUpdate(application.id, 'info_requested', requestMessage);
      setShowRequestInfoModal(false);
      setLoading(false);
    }, 1000);
  };

  const mockDocuments = [
    { name: 'Parent_ID_Proof.pdf', size: '2.3 MB', type: 'pdf' },
    { name: 'Medical_Record.jpg', size: '1.8 MB', type: 'image' }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={onBack}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors duration-200"
          >
            <ArrowLeft className="w-6 h-6 text-gray-600" />
          </button>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Review Application</h2>
            <p className="text-gray-600">{application.id} - {getCertificateTypeLabel(application.type)}</p>
          </div>
        </div>
        
        <div className="flex space-x-3">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowRequestInfoModal(true)}
            className="bg-yellow-600 text-white px-4 py-2 rounded-lg hover:bg-yellow-700 transition-colors duration-200 flex items-center space-x-2"
          >
            <AlertCircle className="w-5 h-5" />
            <span>Request Info</span>
          </motion.button>
          
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowRejectModal(true)}
            className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors duration-200 flex items-center space-x-2"
          >
            <XCircle className="w-5 h-5" />
            <span>Reject</span>
          </motion.button>
          
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleApprove}
            disabled={loading}
            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors duration-200 flex items-center space-x-2 disabled:opacity-50"
          >
            <CheckCircle className="w-5 h-5" />
            <span>{loading ? 'Processing...' : 'Approve'}</span>
          </motion.button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Application Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Basic Information */}
          <div className="bg-white p-6 rounded-lg shadow-lg">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Application Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center space-x-3">
                <User className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="text-sm font-medium text-gray-900">Applicant Name</p>
                  <p className="text-sm text-gray-600">{application.personalInfo.fullName}</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-3">
                <Calendar className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="text-sm font-medium text-gray-900">Submitted Date</p>
                  <p className="text-sm text-gray-600">{application.submittedAt.toLocaleDateString()}</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-3">
                <Mail className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="text-sm font-medium text-gray-900">Email</p>
                  <p className="text-sm text-gray-600">{application.personalInfo.email}</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-3">
                <Phone className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="text-sm font-medium text-gray-900">Mobile</p>
                  <p className="text-sm text-gray-600">{application.personalInfo.mobile}</p>
                </div>
              </div>
              
              <div className="flex items-start space-x-3 md:col-span-2">
                <MapPin className="w-5 h-5 text-gray-400 mt-1" />
                <div>
                  <p className="text-sm font-medium text-gray-900">Address</p>
                  <p className="text-sm text-gray-600">{application.personalInfo.address}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Birth Certificate Specific Details */}
          {application.type === 'birth' && application.birthRegistration && (
            <div className="bg-white p-6 rounded-lg shadow-lg">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Birth Registration Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-gray-900">Child's Name</p>
                  <p className="text-sm text-gray-600">{application.birthRegistration.childName}</p>
                </div>
                
                <div>
                  <p className="text-sm font-medium text-gray-900">Date of Birth</p>
                  <p className="text-sm text-gray-600">{application.birthRegistration.dateOfBirth}</p>
                </div>
                
                <div>
                  <p className="text-sm font-medium text-gray-900">Father's Name</p>
                  <p className="text-sm text-gray-600">{application.birthRegistration.fatherName}</p>
                </div>
                
                <div>
                  <p className="text-sm font-medium text-gray-900">Mother's Name</p>
                  <p className="text-sm text-gray-600">{application.birthRegistration.motherName}</p>
                </div>
                
                <div>
                  <p className="text-sm font-medium text-gray-900">Parent's Nativity</p>
                  <p className="text-sm text-gray-600">{application.birthRegistration.parentNativity}</p>
                </div>
                
                <div className="md:col-span-2">
                  <p className="text-sm font-medium text-gray-900">Full Address</p>
                  <p className="text-sm text-gray-600">{application.birthRegistration.fullAddress}</p>
                </div>
              </div>
            </div>
          )}

          {/* Documents */}
          <div className="bg-white p-6 rounded-lg shadow-lg">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Uploaded Documents</h3>
            <div className="space-y-3">
              {mockDocuments.map((doc, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <FileText className="w-5 h-5 text-gray-500" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">{doc.name}</p>
                      <p className="text-xs text-gray-500">{doc.size}</p>
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <button className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors duration-200">
                      <Eye className="w-4 h-4" />
                    </button>
                    <button className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors duration-200">
                      <Download className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Application Status & Timeline */}
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-lg shadow-lg">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Application Status</h3>
            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <div>
                  <p className="text-sm font-medium text-gray-900">Submitted</p>
                  <p className="text-xs text-gray-500">{application.submittedAt.toLocaleDateString()}</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-3">
                <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                <div>
                  <p className="text-sm font-medium text-gray-900">Under Review</p>
                  <p className="text-xs text-gray-500">Current Status</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-3">
                <div className="w-3 h-3 bg-gray-300 rounded-full"></div>
                <div>
                  <p className="text-sm font-medium text-gray-400">Pending Decision</p>
                  <p className="text-xs text-gray-400">Awaiting approval</p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-lg">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
            <div className="space-y-3">
              <button className="w-full text-left p-3 hover:bg-gray-50 rounded-lg transition-colors duration-200">
                <p className="text-sm font-medium text-gray-900">View Similar Applications</p>
                <p className="text-xs text-gray-500">See other birth certificate applications</p>
              </button>
              
              <button className="w-full text-left p-3 hover:bg-gray-50 rounded-lg transition-colors duration-200">
                <p className="text-sm font-medium text-gray-900">Contact Applicant</p>
                <p className="text-xs text-gray-500">Send message or call</p>
              </button>
              
              <button className="w-full text-left p-3 hover:bg-gray-50 rounded-lg transition-colors duration-200">
                <p className="text-sm font-medium text-gray-900">Application History</p>
                <p className="text-xs text-gray-500">View previous applications</p>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Reject Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white p-6 rounded-lg shadow-xl max-w-md w-full mx-4"
          >
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Reject Application</h3>
            <p className="text-gray-600 mb-4">Please provide a reason for rejecting this application:</p>
            
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
              rows={4}
              placeholder="Enter rejection reason..."
            />
            
            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setShowRejectModal(false)}
                className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors duration-200"
              >
                Cancel
              </button>
              <button
                onClick={handleReject}
                disabled={!rejectReason.trim() || loading}
                className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors duration-200 disabled:opacity-50 flex items-center space-x-2"
              >
                <Send className="w-4 h-4" />
                <span>{loading ? 'Rejecting...' : 'Reject Application'}</span>
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Request Info Modal */}
      {showRequestInfoModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white p-6 rounded-lg shadow-xl max-w-md w-full mx-4"
          >
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Request Additional Information</h3>
            <p className="text-gray-600 mb-4">Specify what additional information or documents are needed:</p>
            
            <textarea
              value={requestMessage}
              onChange={(e) => setRequestMessage(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
              rows={4}
              placeholder="Please provide additional documents or clarify information..."
            />
            
            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setShowRequestInfoModal(false)}
                className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors duration-200"
              >
                Cancel
              </button>
              <button
                onClick={handleRequestInfo}
                disabled={!requestMessage.trim() || loading}
                className="bg-yellow-600 text-white px-4 py-2 rounded-lg hover:bg-yellow-700 transition-colors duration-200 disabled:opacity-50 flex items-center space-x-2"
              >
                <Send className="w-4 h-4" />
                <span>{loading ? 'Sending...' : 'Send Request'}</span>
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default ReviewApplication;