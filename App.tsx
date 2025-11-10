
import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, TimeEntry, ContractorSubmission } from './types';
import { USERS, MOCK_TIME_ENTRIES, MOCK_CONTRACTOR_SUBMISSIONS } from './constants';
import LoginScreen from './components/LoginScreen';
import EmployeeDashboard from './components/EmployeeDashboard';
import ContractorDashboard from './components/ContractorDashboard';
import AdminDashboard from './components/AdminDashboard';
import ChangePasswordScreen from './components/ChangePasswordScreen';

// Helper to load from localStorage
const loadFromLocalStorage = <T,>(key: string, defaultValue: T): T => {
    try {
        const item = window.localStorage.getItem(key);
        return item ? JSON.parse(item, (k, v) => {
            // Revive dates
            if (typeof v === 'string' && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}Z$/.test(v)) {
                return new Date(v);
            }
            return v;
        }) : defaultValue;
    } catch (error) {
        console.warn(`Error reading localStorage key "${key}":`, error);
        return defaultValue;
    }
};

// App Context
interface AppContextType {
  currentUser: User | null;
  users: User[];
  timeEntries: TimeEntry[];
  contractorSubmissions: ContractorSubmission[];
  login: (username: string, password: string) => boolean;
  logout: () => void;
  updatePassword: (newPassword: string) => void;
  addTimeEntry: (entry: Omit<TimeEntry, 'id'>) => void;
  updateTimeEntry: (entry: TimeEntry) => void;
  addContractorSubmission: (submission: Omit<ContractorSubmission, 'id'>) => void;
  addUser: (user: Omit<User, 'id' | 'forcePasswordChange'>) => void;
  updateUser: (user: User) => void;
  deleteUser: (userId: number) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
};

// App Component
const App = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>(() => loadFromLocalStorage('users', USERS));
  const [timeEntries, setTimeEntries] = useState<TimeEntry[]>(() => {
    const saved = loadFromLocalStorage<TimeEntry[]>('timeEntries', []);
    return saved.length > 0 ? saved : MOCK_TIME_ENTRIES.map((e, i) => ({ ...e, id: i + 1 }));
  });
  const [contractorSubmissions, setContractorSubmissions] = useState<ContractorSubmission[]>(() => {
     const saved = loadFromLocalStorage<ContractorSubmission[]>('contractorSubmissions', []);
     return saved.length > 0 ? saved : MOCK_CONTRACTOR_SUBMISSIONS.map((s, i) => ({ ...s, id: i + 1 }));
  });
  
  // Persist state to localStorage
  useEffect(() => {
    localStorage.setItem('users', JSON.stringify(users));
  }, [users]);

  useEffect(() => {
    localStorage.setItem('timeEntries', JSON.stringify(timeEntries));
  }, [timeEntries]);

  useEffect(() => {
    localStorage.setItem('contractorSubmissions', JSON.stringify(contractorSubmissions));
  }, [contractorSubmissions]);

  // Auth functions
  const login = (username: string, password: string): boolean => {
    const user = users.find(u => u.name === username && u.password === password);
    if (user) {
      setCurrentUser(user);
      return true;
    }
    return false;
  };

  const logout = () => {
    setCurrentUser(null);
  };
  
  const updatePassword = (newPassword: string) => {
    if (currentUser) {
        const updatedUser = { ...currentUser, password: newPassword, forcePasswordChange: false };
        setUsers(users.map(u => u.id === currentUser.id ? updatedUser : u));
        setCurrentUser(updatedUser);
    }
  };

  // Data functions
  const addTimeEntry = (entry: Omit<TimeEntry, 'id'>) => {
    setTimeEntries(prev => [...prev, { ...entry, id: Date.now() }]);
  };

  const updateTimeEntry = (updatedEntry: TimeEntry) => {
    setTimeEntries(prev => prev.map(e => e.id === updatedEntry.id ? updatedEntry : e));
  };
  
  const addContractorSubmission = (submission: Omit<ContractorSubmission, 'id'>) => {
    setContractorSubmissions(prev => [...prev, { ...submission, id: Date.now() }]);
  };

  const addUser = (user: Omit<User, 'id' | 'forcePasswordChange' | 'password'> & { password?: string }) => {
    const newUser: User = { ...user, id: Date.now(), forcePasswordChange: true, password: user.password || `temp${Date.now()}` };
    setUsers(prev => [...prev, newUser]);
  };
  
  const updateUser = (updatedUser: User) => {
    setUsers(prev => prev.map(u => u.id === updatedUser.id ? updatedUser : u));
  };

  const deleteUser = (userId: number) => {
    setUsers(prev => prev.filter(u => u.id !== userId));
  };

  const contextValue: AppContextType = {
    currentUser,
    users,
    timeEntries,
    contractorSubmissions,
    login,
    logout,
    updatePassword,
    addTimeEntry,
    updateTimeEntry,
    addContractorSubmission,
    addUser,
    updateUser,
    deleteUser,
  };

  const renderContent = () => {
    if (!currentUser) {
      return <LoginScreen />;
    }
    if (currentUser.forcePasswordChange) {
        return <ChangePasswordScreen />;
    }

    switch (currentUser.role) {
      case 'employee':
        return <EmployeeDashboard />;
      case 'contractor':
        return <ContractorDashboard />;
      case 'admin':
      case 'creator':
        return <AdminDashboard />;
      default:
        return <LoginScreen />;
    }
  };

  return (
    <AppContext.Provider value={contextValue}>
      <div className="bg-slate-100 dark:bg-slate-900 text-slate-900 dark:text-slate-100 min-h-screen">
          {renderContent()}
      </div>
    </AppContext.Provider>
  );
};

export default App;
