export interface User {
  id: string;
  name: string;
  email: string;
  mobile: string;
  role: 'user' | 'officer';
  officerId?: string;
}

export interface Application {
  id: string;
  userId: string;
  type: 'income' | 'caste' | 'birth' | 'residence';
  personalInfo: {
    fullName: string;
    email: string;
    mobile: string;
    address: string;
  };
  birthRegistration?: {
    childName: string;
    dateOfBirth: string;
    fatherName: string;
    motherName: string;
    parentIdProof: File | null;
    medicalRecord: File | null;
    fullAddress: string;
    parentNativity: string;
  };
  birthUpdate?: {
    currentName: string;
    correctName: string;
    currentDob: string;
    correctDob: string;
    currentGender: string;
    correctGender: string;
    proofDocuments: File[];
  };
  documents: File[];
  status: 'submitted' | 'under_review' | 'approved' | 'rejected' | 'info_requested';
  submittedAt: Date;
  officerId?: string;
  officerName?: string;
  estimatedDelivery?: Date;
  qrCode?: string;
  rejectionReason?: string;
  requestedInfo?: string;
}

export interface Officer {
  id: string;
  name: string;
  email: string;
  officerId: string;
  district: string;
  resolvedCases: number;
}

export interface AuditEntry {
  id: string;
  applicationId: string;
  applicantName: string;
  certificateType: string;
  officerName: string;
  approvedAt: Date;
  district: string;
}

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  createdAt: Date;
  read: boolean;
}