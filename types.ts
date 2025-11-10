export type UserRole = 'employee' | 'contractor' | 'admin' | 'creator';

export interface User {
  id: number;
  name: string;
  role: UserRole;
  password?: string; // Should be handled securely on a backend in a real app
  forcePasswordChange: boolean;
}

export interface LocationInfo {
  latitude: number;
  longitude: number;
  description: string;
  mapUri?: string;
}

export interface TimeEntry {
  id: number;
  userId: number;
  userName: string;
  clockIn: Date;
  clockOut?: Date;
  clockInLocation: LocationInfo;
  clockOutLocation?: LocationInfo;
  overtimeHours?: number;
}

export interface ContractorSubmission {
  id: number;
  contractorId: number;
  employeeName: string;
  cedula: string;
  obra: string;
  hoursWorked: number;
  dailyRate: number;
  submissionDate: Date;
}

export interface ChatMessage {
    id: string;
    sender: 'user' | 'bot';
    text: string;
}