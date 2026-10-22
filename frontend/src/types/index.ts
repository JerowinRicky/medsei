export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  title?: string;
  role: {
    id: string;
    name: string;
    code: string;
  };
  organization: {
    id: string;
    name: string;
    code: string;
  };
  permissions: string[];
}

export interface Patient {
  id: string;
  uhid: string;
  externalId?: string;
  firstName: string;
  lastName: string;
  fullName: string;
  dob?: string;
  age?: number;
  gender: string;
  phone?: string;
  address?: string;
  source: string;
}

export interface Task {
  id: string;
  taskNumber: string;
  dataSource: "HMS" | "DOCUMENT" | "HMS_AND_DOCUMENT";
  status: string;
  patient?: Patient;
  encounter?: any;
  project?: any;
  projectType?: any;
  assignedUser?: any;
  reviewerUser?: any;
  unifiedClinicalData?: any;
  conflictData?: any[];
  documents?: any[];
  generatedSummaries?: any[];
  auditLogs?: any[];
  createdAt: string;
  updatedAt: string;
}

