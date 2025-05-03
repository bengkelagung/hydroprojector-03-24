import React, { createContext, useContext, useState, useEffect } from 'react';
import { useToast } from "../components/ui/use-toast";
import { supabase } from '../integrations/supabase/client';
import { Session, User } from '@supabase/supabase-js';

interface AuthUser {
  id: string;
  email: string;
  name: string;
  phone?: string;
  image?: string;
}

interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  session: Session | null;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshSession: () => Promise<boolean>;
  deleteAccount: (password: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState<Session | null>(null);
  const { toast } = useToast();

  const refreshSession = async (): Promise<boolean> => {
    try {
      const { data, error } = await supabase.auth.refreshSession();
      if (error) {
        console.error("Failed to refresh session:", error);
        return false;
      }
      return true;
    } catch (error) {
      console.error("Error refreshing session:", error);
      return false;
    }
  };

  const updateUserState = (session: Session | null) => {
    if (session?.user) {
      const { id, email, user_metadata } = session.user;
      setUser({
        id,
        email: email || '',
        name: user_metadata.first_name ? `${user_metadata.first_name} ${user_metadata.last_name || ''}`.trim() : email?.split('@')[0] || 'User',
        phone: user_metadata.phone || '',
        image: user_metadata.avatar_url || ''
      });
    } else {
      setUser(null);
    }
  };

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event: string, session: Session | null) => {
        setSession(session);
        setLoading(true);
        updateUserState(session);
        setLoading(false);
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      // Fetch profile data
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', data.user.id)
        .single();

      if (!profileError && profileData) {
        // Update user metadata with profile data
        await supabase.auth.updateUser({
          data: {
            first_name: profileData.first_name,
            last_name: profileData.last_name,
            avatar_url: profileData.avatar_url
          }
        });
      }

      toast({
        title: "Success",
        description: "Logged in successfully",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
      throw error;
    }
  };

  const register = async (name: string, email: string, password: string) => {
    try {
      // Split name into first and last name
      const [firstName, ...lastNameParts] = name.split(' ');
      const lastName = lastNameParts.join(' ');

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            first_name: firstName,
            last_name: lastName || null,
          },
        },
      });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Registration successful! Please check your email for verification.",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
      throw error;
    }
  };

  const logout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      
      toast({
        title: "Success",
        description: "Logged out successfully",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
      throw error;
    }
  };

  const deleteAccount = async (password: string) => {
    try {
      if (!user?.id) {
        throw new Error('User not found');
      }

      // First verify the password
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: user.email,
        password,
      });

      if (signInError) {
        toast({
          title: "Error",
          description: "Invalid password",
          variant: "destructive",
        });
        throw signInError;
      }

      // Delete user data from profiles table first
      const { error: profileDeleteError } = await supabase
        .from('profiles')
        .delete()
        .eq('user_id', user.id);

      if (profileDeleteError) throw profileDeleteError;

      // Delete the user's auth account
      const { error: deleteError } = await supabase.auth.updateUser({
        data: { deleted: true }
      });

      if (deleteError) throw deleteError;

      toast({
        title: "Success",
        description: "Your account has been deleted",
      });

      // Sign out after deletion
      await supabase.auth.signOut();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
      throw error;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        session,
        login,
        register,
        logout,
        refreshSession,
        deleteAccount,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
