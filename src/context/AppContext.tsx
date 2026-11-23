import React, { createContext, useContext, useState, useEffect } from 'react';
import { NavigationTab, User } from '../types/database';
import { getStoredConfig, saveStoredConfig, testSupabaseConnection, getSupabase } from '../services/supabase';
import { getUsers } from '../services/api';

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'info' | 'warning';
  title: string;
  message?: string;
}

interface AppContextType {
  activeTab: NavigationTab;
  setActiveTab: (tab: NavigationTab) => void;
  currentUser: User | null;
  setCurrentUser: (user: User | null) => void;
  availableUsers: User[];
  isDemoMode: boolean;
  toggleDemoMode: (force?: boolean) => void;
  supabaseConnected: boolean;
  supabaseUrl: string;
  checkConnection: () => Promise<void>;
  toasts: ToastMessage[];
  addToast: (toast: Omit<ToastMessage, 'id'>) => void;
  removeToast: (id: string) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  refreshKey: number;
  triggerRefresh: () => void;
  selectedIncidentId: number | null;
  setSelectedIncidentId: (id: number | null) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [activeTab, setActiveTab] = useState<NavigationTab>('dashboard');
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [availableUsers, setAvailableUsers] = useState<User[]>([]);
  const [isDemoMode, setIsDemoMode] = useState<boolean>(true);
  const [supabaseConnected, setSupabaseConnected] = useState<boolean>(false);
  const [supabaseUrl, setSupabaseUrl] = useState<string>('');
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [refreshKey, setRefreshKey] = useState<number>(0);
  const [selectedIncidentId, setSelectedIncidentId] = useState<number | null>(null);

  const addToast = (toast: Omit<ToastMessage, 'id'>) => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts(prev => [...prev, { ...toast, id }]);
    setTimeout(() => {
      removeToast(id);
    }, 4500);
  };

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  const triggerRefresh = () => {
    setRefreshKey(prev => prev + 1);
  };

  const checkConnection = async () => {
    const config = getStoredConfig();
    setSupabaseUrl(config.supabaseUrl || '');
    if (config.forceDemo || !config.isConfigured) {
      setIsDemoMode(true);
      setSupabaseConnected(false);
      return;
    }

    const res = await testSupabaseConnection();
    if (res.success) {
      setSupabaseConnected(true);
      setIsDemoMode(false);
      addToast({
        type: 'success',
        title: 'Supabase Connected',
        message: 'Live connection to PostgreSQL schema active.',
      });
    } else {
      setSupabaseConnected(false);
      setIsDemoMode(true);
    }
  };

  const toggleDemoMode = (force?: boolean) => {
    const config = getStoredConfig();
    const newDemo = force !== undefined ? force : !isDemoMode;
    saveStoredConfig(config.supabaseUrl, config.supabaseKey, newDemo);
    setIsDemoMode(newDemo);
    if (!newDemo) {
      checkConnection();
    } else {
      setSupabaseConnected(false);
      addToast({
        type: 'info',
        title: 'Demo Mode Active',
        message: 'Operating with local database simulation and pre-seeded college records.',
      });
    }
    triggerRefresh();
  };

  // Load initial users & test connection on mount
  useEffect(() => {
    checkConnection();
  }, []);

  useEffect(() => {
    getUsers()
      .then(users => {
        setAvailableUsers(users);
        if (users.length > 0 && !currentUser) {
          setCurrentUser(users[0]);
        }
      })
      .catch(console.error);
  }, [refreshKey, isDemoMode]);

  return (
    <AppContext.Provider
      value={{
        activeTab,
        setActiveTab,
        currentUser,
        setCurrentUser,
        availableUsers,
        isDemoMode,
        toggleDemoMode,
        supabaseConnected,
        supabaseUrl,
        checkConnection,
        toasts,
        addToast,
        removeToast,
        searchQuery,
        setSearchQuery,
        refreshKey,
        triggerRefresh,
        selectedIncidentId,
        setSelectedIncidentId,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
