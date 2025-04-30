
import { useState, useEffect } from 'react';
import { supabase, ensureAnonymousUser } from "@/integrations/supabase/client";
import { AppUser } from '../types';
import { saveToLocalStorage, getFromLocalStorage } from '../utils';
import { Session } from '@supabase/supabase-js';

export const useAuthState = () => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [currentUser, setCurrentUser] = useState<AppUser | null>(null);
  const [session, setSession] = useState<Session | null>(null);

  // Initialize state from localStorage after component mounts
  useEffect(() => {
    const storedUser = getFromLocalStorage("currentUser");
    if (storedUser) {
      setCurrentUser(storedUser);
      setIsAuthenticated(true);
    }
  }, []);

  // Initialize Supabase auth with anonymous auth fallback
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        // Ensure there's always a session, even if anonymous
        await ensureAnonymousUser().catch(err => {
          console.error("Anonymous auth failed:", err.message);
        });
        
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
          (event, session) => {
            setSession(session);
            if (session?.user) {
              const user: AppUser = {
                id: session.user.id,
                email: session.user.email || '',
                name: session.user.user_metadata?.name || ''
              };
              setCurrentUser(user);
              setIsAuthenticated(true);
              saveToLocalStorage("currentUser", user);
            } else {
              // If session is lost, create a new anonymous session
              ensureAnonymousUser().catch(err => {
                console.error("Anonymous auth failed:", err.message);
              });
            }
          }
        );
        
        supabase.auth.getSession().then(({ data: { session } }) => {
          setSession(session);
          if (session?.user) {
            const user: AppUser = {
              id: session.user.id,
              email: session.user.email || '',
              name: session.user.user_metadata?.name || ''
            };
            setCurrentUser(user);
            setIsAuthenticated(true);
            saveToLocalStorage("currentUser", user);
          }
        });
        
        return () => {
          subscription.unsubscribe();
        };
      } catch (error) {
        console.error("Error in initializing auth:", error);
      }
    };
    
    initializeAuth();
  }, []);

  // Auth functions
  const login = async (email: string, password: string): Promise<void> => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    
    if (error) {
      throw new Error(error.message);
    }
  };
  
  const register = async (email: string, password: string, name: string): Promise<void> => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name,
        },
      },
    });
    
    if (error) {
      throw new Error(error.message);
    }
  };
  
  const logout = async (): Promise<void> => {
    await supabase.auth.signOut();
    // Create a new anonymous session immediately after logout
    setTimeout(() => ensureAnonymousUser().catch(err => {
      console.error("Anonymous auth failed:", err.message);
    }), 100);
  };

  return {
    isAuthenticated,
    currentUser,
    session,
    login,
    register,
    logout,
  };
};
