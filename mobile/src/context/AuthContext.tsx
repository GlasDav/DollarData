import React, { createContext, useState, useContext, useEffect, PropsWithChildren } from 'react';
import { supabase } from '../lib/supabase';
import api from '../api/api';
import { useRouter, useSegments } from 'expo-router';

type User = {
    id: string;
    email: string;
    name?: string;
    created_at?: string;
};

type AuthContextType = {
    user: User | null;
    session: any | null;
    isLoading: boolean;
    signIn: (email: string, password: string) => Promise<void>;
    signUp: (email: string, password: string, name: string) => Promise<void>;
    signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

// Hook for consuming Auth Context
export function useAuth() {
    return useContext(AuthContext);
}

// Provider Component
export function AuthProvider({ children }: PropsWithChildren) {
    const [user, setUser] = useState<User | null>(null);
    const [session, setSession] = useState<any | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const router = useRouter();
    const segments = useSegments();

    useEffect(() => {
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
            setSession(session);
            if (session) {
                // Fetch full profile from backend
                try {
                    const res = await api.get("/auth/users/me");
                    setUser(res.data);
                } catch (error) {
                    console.error("Failed to fetch user profile", error);
                    setUser({
                        id: session.user.id,
                        email: session.user.email!,
                    });
                }
            } else {
                setUser(null);
            }
            setIsLoading(false);
        });

        return () => subscription.unsubscribe();
    }, []);

    // Protected Route Logic
    useEffect(() => {
        if (isLoading) return;

        const inAuthGroup = segments[0] === '(auth)';

        if (!user && !inAuthGroup) {
            router.replace('/(auth)/login');
        } else if (user && inAuthGroup) {
            router.replace('/(drawer)');
        }
    }, [user, segments, isLoading]);

    const signIn = async (email: string, password: string) => {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
    };

    const signUp = async (email: string, password: string, name: string) => {
        const { error } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: { name },
            },
        });
        if (error) throw error;
    };

    const signOut = async () => {
        await supabase.auth.signOut();
    };

    return (
        <AuthContext.Provider value={{ user, session, isLoading, signIn, signUp, signOut }}>
            {children}
        </AuthContext.Provider>
    );
}
