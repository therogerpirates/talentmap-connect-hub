
import { createContext, useContext, useEffect, useState } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

interface Profile {
  id: string;
  email: string;
  full_name: string;
  role: 'student' | 'admin';
}

interface AuthContextType {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session?.user) {
        fetchProfile(session.user.id);
      } else {
        setLoading(false);
      }
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session?.user) {
        fetchProfile(session.user.id);
      } else {
        setProfile(null);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchProfile = async (userId: string) => {
    try {
      // 1. Try fetching from profiles (Admins/Recruiters)
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('id, email, full_name, role')
        .eq('id', userId)
        .maybeSingle();

      if (profileData) {
        setProfile(profileData);
        return;
      }

      // 2. If no profile found, try fetching from students
      const { data: studentData, error: studentError } = await supabase
        .from('students')
        .select('id, email, full_name')
        .eq('id', userId)
        .maybeSingle();

      if (studentData) {
        // Normalize student data to Profile interface
        setProfile({
          id: studentData.id,
          email: studentData.email || '',
          full_name: studentData.full_name || '',
          role: 'student'
        });
        return;
      }

      // If neither found (rare race condition or error), log it but don't crash
      console.warn("User logged in but no profile found in profiles or students table.");
      setProfile(null);

    } catch (error) {
      console.error('Error fetching profile:', error);
      setProfile(null);
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider value={{
      session,
      user: session?.user || null,
      profile,
      loading,
      signOut
    }}>
      {children}
    </AuthContext.Provider>
  );
};
