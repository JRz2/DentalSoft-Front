import type React from "react";
import { useAuth } from "../../contexts/AuthContext";
import { Navigate } from "react-router-dom";

export const ProtectedRoute = ({ children }: { children: React.ReactNode}) => {
    const { isAuthenticated, isLoading } = useAuth();

    if(isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className=" animte-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
            </div>
        );
    }

    return isAuthenticated ? <>{children}</> : <Navigate to={"/login"} />
};