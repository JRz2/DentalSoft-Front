import { createContext, useContext, useEffect, useState } from "react";
import type { AuthResponse, LoginDto, RegisterDto, User } from "../types";
import api from "../services/api";

interface AuthContextType{
    user: User | null;
    isLoading: boolean;
    login: (credentials: LoginDto) => Promise<void>;
    register: (userData: RegisterDto) => Promise<void>;
    logout: () => void;
    isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const token = localStorage.getItem('token');
        const storedUser = localStorage.getItem('user');
        if (token && storedUser) {
            setUser(JSON.parse(storedUser));
        }
        setIsLoading(false);
    }, []);

    const login = async (credentials: LoginDto) => {
        const response = await api.post<AuthResponse>('/auth/login', credentials);
        const { token, user } = response.data;
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(user));
        setUser(user);
    };
    
    const register = async (userData: RegisterDto) => {
        const response = await api.post('/auth/register', userData);
        return response.data;
    };

    const logout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{
            user,
            isLoading,
            login,
            register,
            logout,
            isAuthenticated: !!user
        }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
        const context = useContext(AuthContext);
        if (!context) throw new Error('useAuth must be used within an AuthProvider');
        return context;
};
        