import { User, TimeEntry, ContractorSubmission } from './types';

export const USERS: User[] = [
  { id: 1, name: 'Alice', role: 'employee', password: 'password123', forcePasswordChange: true },
  { id: 2, name: 'Bob', role: 'employee', password: 'password456', forcePasswordChange: false },
  { id: 3, name: 'Charlie', role: 'contractor', password: 'password789', forcePasswordChange: false },
  { id: 4, name: 'Admin User', role: 'admin', password: 'adminpassword', forcePasswordChange: false },
  { id: 5, name: 'Creator User', role: 'creator', password: 'creatorpassword', forcePasswordChange: false },
];

// Mock data for time entries
export const MOCK_TIME_ENTRIES: Omit<TimeEntry, 'id'>[] = [
  {
    userId: 1,
    userName: 'Alice',
    clockIn: new Date(new Date().setDate(new Date().getDate() - 1)),
    clockOut: new Date(new Date(new Date().setDate(new Date().getDate() - 1)).setHours(17)),
    clockInLocation: { latitude: 34.0522, longitude: -118.2437, description: "Union Station, Los Angeles" },
    clockOutLocation: { latitude: 34.0522, longitude: -118.2437, description: "Union Station, Los Angeles" },
    overtimeHours: 1.5,
  },
  {
    userId: 2,
    userName: 'Bob',
    clockIn: new Date(new Date().setDate(new Date().getDate() - 2)),
    clockOut: new Date(new Date(new Date().setDate(new Date().getDate() - 2)).setHours(18)),
    clockInLocation: { latitude: 40.7128, longitude: -74.0060, description: "City Hall, New York" },
    clockOutLocation: { latitude: 40.7128, longitude: -74.0060, description: "City Hall, New York" },
  }
];

// Mock data for contractor submissions
export const MOCK_CONTRACTOR_SUBMISSIONS: Omit<ContractorSubmission, 'id'>[] = [
  {
    contractorId: 3,
    employeeName: 'Dave',
    cedula: '123456789',
    obra: 'Proyecto Edificio Central',
    hoursWorked: 40,
    dailyRate: 500,
    submissionDate: new Date(new Date().setDate(new Date().getDate() - 5)),
  },
  {
    contractorId: 3,
    employeeName: 'Eve',
    cedula: '987654321',
    obra: 'Remodelación Ala Oeste',
    hoursWorked: 35,
    dailyRate: 450,
    submissionDate: new Date(new Date().setDate(new Date().getDate() - 3)),
  }
];