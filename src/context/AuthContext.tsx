import React, { createContext, useContext, useState, useEffect } from 'react';
import type { UserProfile } from '../types';
import { supabase, StorageService, DEFAULT_DEMO_USER } from '../lib/supabase';

interface AuthContextType {
  user: UserProfile | null;
  isAuthenticated: boolean;
  isOnboarded: boolean;
  isLoading: boolean;
  login: (email: string, pass?: string) => Promise<{ success: boolean; error?: string }>;
  register: (email: string, pass: string, fullName: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  updateProfile: (updates: Partial<UserProfile>) => void;
  resetOnboarding: () => void;
  switchDemoRole: (roleType: 'student' | 'professional' | 'admin') => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(() => StorageService.getUser());
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    // If Supabase is connected, listen to auth state changes
    const client = supabase;
    if (client) {
      const { data: authListener } = client.auth.onAuthStateChange(async (_event, session) => {
        if (session?.user) {
          const { data: profile } = await client
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .single();

          if (profile) {
            setUser(profile as any);
            StorageService.saveUser(profile as any);
          }
        }
        setIsLoading(false);
      });

      return () => {
        authListener.subscription.unsubscribe();
      };
    } else {
      setIsLoading(false);
    }
  }, []);

  const login = async (email: string, _pass?: string) => {
    try {
      if (supabase) {
        const { error } = await supabase.auth.signInWithPassword({ email, password: _pass || 'password' });
        if (error) return { success: false, error: error.message };
      }
      
      const existing = StorageService.getUser();
      const updatedUser: UserProfile = existing ? { ...existing, email } : {
        ...DEFAULT_DEMO_USER,
        email,
      };
      setUser(updatedUser);
      StorageService.saveUser(updatedUser);
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || 'Login failed' };
    }
  };

  const register = async (email: string, _pass: string, fullName: string) => {
    try {
      if (supabase) {
        const { error } = await supabase.auth.signUp({
          email,
          password: _pass,
          options: { data: { full_name: fullName } },
        });
        if (error) return { success: false, error: error.message };
      }

      const newUser: UserProfile = {
        ...DEFAULT_DEMO_USER,
        id: `usr-${Date.now()}`,
        email,
        personal: {
          ...DEFAULT_DEMO_USER.personal,
          fullName,
        },
        isOnboarded: false, // New users start onboarding
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      setUser(newUser);
      StorageService.saveUser(newUser);
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || 'Registration failed' };
    }
  };

  const logout = async () => {
    if (supabase) {
      await supabase.auth.signOut();
    }
    setUser(null);
    StorageService.clearUser();
  };

  const updateProfile = (updates: Partial<UserProfile>) => {
    if (!user) return;
    const updated: UserProfile = {
      ...user,
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    setUser(updated);
    StorageService.saveUser(updated);

    if (supabase) {
      Promise.resolve(supabase.from('profiles').upsert(updated)).catch((err: any) => {
        console.warn('Failed to sync profile to Supabase:', err);
      });
    }
  };

  const resetOnboarding = () => {
    if (!user) return;
    updateProfile({ isOnboarded: false });
  };

  const switchDemoRole = (roleType: 'student' | 'professional' | 'admin') => {
    if (roleType === 'student') {
      const studentProfile: UserProfile = {
        ...DEFAULT_DEMO_USER,
        role: 'user',
        personal: {
          fullName: 'Aarav Sharma',
          age: 20,
          country: 'India',
          state: 'Maharashtra',
          qualification: 'Undergraduate',
          collegeOrUniversity: 'IIT Bombay',
          degreeAndBranch: 'B.Tech Computer Science',
          currentYearOfStudy: 3,
          graduationYear: 2027,
          status: 'Student',
        },
        isOnboarded: true,
      };
      setUser(studentProfile);
      StorageService.saveUser(studentProfile);
    } else if (roleType === 'professional') {
      const proProfile: UserProfile = {
        ...DEFAULT_DEMO_USER,
        id: 'usr-pro-002',
        role: 'user',
        email: 'priya.nair@techfirm.com',
        personal: {
          fullName: 'Priya Nair',
          age: 27,
          country: 'India',
          state: 'Karnataka',
          qualification: 'Working Professional',
          collegeOrUniversity: 'BITS Pilani Alumni',
          degreeAndBranch: 'M.S. Software Engineering',
          currentYearOfStudy: undefined,
          graduationYear: 2021,
          status: 'Working Professional',
        },
        skills: {
          ...DEFAULT_DEMO_USER.skills,
          programmingLanguages: ['Rust', 'Go', 'Python', 'TypeScript'],
          cloudDevOps: ['Kubernetes', 'Docker', 'AWS', 'Terraform'],
        },
        preferences: {
          ...DEFAULT_DEMO_USER.preferences,
          maxRegistrationFee: 50,
          preferredFormats: ['Online', 'Offline', 'Hybrid'],
        },
        isOnboarded: true,
      };
      setUser(proProfile);
      StorageService.saveUser(proProfile);
    } else if (roleType === 'admin') {
      const adminProfile: UserProfile = {
        ...DEFAULT_DEMO_USER,
        id: 'usr-admin-001',
        role: 'admin',
        email: 'admin@hackmate.app',
        personal: {
          ...DEFAULT_DEMO_USER.personal,
          fullName: 'HackMate Platform Admin',
        },
        isOnboarded: true,
      };
      setUser(adminProfile);
      StorageService.saveUser(adminProfile);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: user !== null,
        isOnboarded: user?.isOnboarded ?? false,
        isLoading,
        login,
        register,
        logout,
        updateProfile,
        resetOnboarding,
        switchDemoRole,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
