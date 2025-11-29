import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, TimeEntry, ContractorSubmission } from './types';
import LoginScreen from './components/LoginScreen';
import EmployeeDashboard from './components/EmployeeDashboard';
import ContractorDashboard from './components/ContractorDashboard';
import AdminDashboard from './components/AdminDashboard';
import ChangePasswordScreen from './components/ChangePasswordScreen';
import { api } from './services/api';

// App Context
interface AppContextType {
  currentUser: User | null;
  users: User[];
  timeEntries: TimeEntry[];
  contractorSubmissions: ContractorSubmission[];
  isLoading: boolean;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
  updatePassword: (newPassword: string) => Promise<void>;
  addTimeEntry: (entry: Omit<TimeEntry, 'id'>) => Promise<void>;
  updateTimeEntry: (entry: TimeEntry) => Promise<void>;
  addContractorSubmission: (submission: Omit<ContractorSubmission, 'id'>) => Promise<void>;
  addUser: (user: Omit<User, 'id' | 'forcePasswordChange'>) => Promise<void>;
  updateUser: (user: User) => Promise<void>;
  deleteUser: (userId: number) => Promise<void>;
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
  const [users, setUsers] = useState<User[]>([]);
  const [timeEntries, setTimeEntries] = useState<TimeEntry[]>([]);
  const [contractorSubmissions, setContractorSubmissions] = useState<ContractorSubmission[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isAppInitializing, setIsAppInitializing] = useState(true);
  const [connectionStatus, setConnectionStatus] = useState<'online' | 'local'>('online');

  // Initial Data Fetch
  useEffect(() => {
    const initData = async () => {
        try {
            // La API interna se encarga de decidir si usa el Backend real o el LocalStorage
            const fetchedUsers = await api.getUsers();
            const fetchedEntries = await api.getTimeEntries();
            const fetchedSubmissions = await api.getContractorSubmissions();
            
            setUsers(fetchedUsers);
            setTimeEntries(fetchedEntries);
            setContractorSubmissions(fetchedSubmissions);
            
            // Check connection status after initial fetch
            setConnectionStatus(api.getBackendStatus() ? 'online' : 'local');
        } catch (error) {
            console.error("Failed to load initial data", error);
            setConnectionStatus('local');
        } finally {
            setIsAppInitializing(false);
        }
    };
    initData();
  }, []);

  // Update connection status periodically or after actions
  useEffect(() => {
      const checkStatus = () => {
          setConnectionStatus(api.getBackendStatus() ? 'online' : 'local');
      };
      // Check every 5 seconds or just rely on state updates if preferred, 
      // but interval is good for visual feedback if server dies.
      const interval = setInterval(checkStatus, 5000);
      return () => clearInterval(interval);
  });

  // Auth functions
  const login = async (username: string, password: string): Promise<boolean> => {
    setIsLoading(true);
    try {
        const user = await api.login(username, password);
        if (user) {
            setCurrentUser(user);
            return true;
        }
        return false;
    } catch (e) {
        alert("Error al intentar iniciar sesión.");
        return false;
    } finally {
        setIsLoading(false);
        setConnectionStatus(api.getBackendStatus() ? 'online' : 'local');
    }
  };

  const logout = () => {
    setCurrentUser(null);
  };
  
  const updatePassword = async (newPassword: string) => {
    if (currentUser) {
        setIsLoading(true);
        const updatedUser = { ...currentUser, password: newPassword, forcePasswordChange: false };
        await api.updateUser(updatedUser);
        
        // Update local state
        setUsers(prev => prev.map(u => u.id === currentUser.id ? updatedUser : u));
        setCurrentUser(updatedUser);
        setIsLoading(false);
        setConnectionStatus(api.getBackendStatus() ? 'online' : 'local');
    }
  };

  // Data functions
  const addTimeEntry = async (entry: Omit<TimeEntry, 'id'>) => {
    const newEntry = await api.createTimeEntry(entry);
    setTimeEntries(prev => [...prev, newEntry]);
    setConnectionStatus(api.getBackendStatus() ? 'online' : 'local');
  };

  const updateTimeEntry = async (updatedEntry: TimeEntry) => {
    await api.updateTimeEntry(updatedEntry);
    setTimeEntries(prev => prev.map(e => e.id === updatedEntry.id ? updatedEntry : e));
    setConnectionStatus(api.getBackendStatus() ? 'online' : 'local');
  };
  
  const addContractorSubmission = async (submission: Omit<ContractorSubmission, 'id'>) => {
    const newSubmission = await api.createContractorSubmission(submission);
    setContractorSubmissions(prev => [...prev, newSubmission]);
    setConnectionStatus(api.getBackendStatus() ? 'online' : 'local');
  };

  const addUser = async (user: Omit<User, 'id' | 'forcePasswordChange' | 'password'> & { password?: string }) => {
    const newUser = await api.createUser({
        ...user,
        password: user.password || `temp${Date.now()}`
    });
    setUsers(prev => [...prev, newUser]);
    setConnectionStatus(api.getBackendStatus() ? 'online' : 'local');
  };
  
  const updateUser = async (updatedUser: User) => {
    await api.updateUser(updatedUser);
    setUsers(prev => prev.map(u => u.id === updatedUser.id ? updatedUser : u));
    setConnectionStatus(api.getBackendStatus() ? 'online' : 'local');
  };

  const deleteUser = async (userId: number) => {
    await api.deleteUser(userId);
    setUsers(prev => prev.filter(u => u.id !== userId));
    setConnectionStatus(api.getBackendStatus() ? 'online' : 'local');
  };

  const contextValue: AppContextType = {
    currentUser,
    users,
    timeEntries,
    contractorSubmissions,
    isLoading,
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
    if (isAppInitializing) {
        return (
            <div className="flex h-screen items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                    <p className="text-slate-500 font-semibold">Cargando Sistema PECC-TIME...</p>
                </div>
            </div>
        );
    }

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
      <div className="bg-slate-100 dark:bg-slate-900 text-slate-900 dark:text-slate-100 min-h-screen pb-8">
          {renderContent()}
          
          {/* Connection Status Footer */}
          <div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700 p-2 text-xs flex justify-center items-center gap-2 shadow-md">
            {connectionStatus === 'online' ? (
                <>
                    <span className="relative flex h-3 w-3">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
                    </span>
                    <span className="font-semibold text-green-700 dark:text-green-400">Conectado al Servidor (Persistencia Real)</span>
                </>
            ) : (
                 <>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-orange-500"></span>
                    <span className="font-semibold text-orange-700 dark:text-orange-400">Modo Local (Solo Navegador)</span>
                </>
            )}
          </div>
      </div>
    </AppContext.Provider>
  );
};

export default App;