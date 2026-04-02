import { createContext, useContext, useEffect, useState } from "react";
import type { LoginDto, RegisterDto, User } from "../types";
import api from "../services/api";

interface AuthContextType {
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
        console.log('🔍 Verificando localStorage:', { token: !!token, user: !!storedUser });

        if (token && storedUser) {
            try {
                setUser(JSON.parse(storedUser));
                console.log('✅ Usuario cargado desde localStorage');
            } catch (error) {
                console.error('Error parsing user:', error);
                localStorage.removeItem('user');
            }
        }
        setIsLoading(false);
    }, []);

    const login = async (credentials: LoginDto) => {
        console.log('🔐 Intentando login con:', credentials.email);
        try {
            const response = await api.post('/auth/login', credentials);
            console.log('📦 Respuesta del servidor:', response.data);

            // 👇 IMPORTANTE: Usamos access_token como viene de tu backend
            const token = response.data.access_token;  // ← CAMBIADO: access_token
            const user = response.data.user;

            console.log('🔑 Token obtenido:', token ? 'Sí' : 'No');
            console.log('👤 Usuario obtenido:', user?.name);

            if (token && user) {
                // Guardar en localStorage
                localStorage.setItem('token', token);
                localStorage.setItem('user', JSON.stringify(user));

                console.log('💾 Token guardado:', !!localStorage.getItem('token'));
                console.log('💾 User guardado:', !!localStorage.getItem('user'));

                setUser(user);
                console.log('✅ Login exitoso');
            } else {
                console.error('❌ Respuesta sin token o usuario');
                throw new Error('Respuesta inválida del servidor');
            }
        } catch (error) {
            console.error('❌ Error en login:', error);
            throw error;
        }
    };

    const register = async (userData: RegisterDto) => {
        console.log('📝 Registrando usuario:', userData.email);
        try {
            const response = await api.post('/auth/register', userData);
            console.log('✅ Registro exitoso');
            return response.data;
        } catch (error) {
            console.error('❌ Error en registro:', error);
            throw error;
        }
    };

    const logout = () => {
        console.log('🚪 Cerrando sesión');
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