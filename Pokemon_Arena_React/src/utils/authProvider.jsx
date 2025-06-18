import { createContext, useState, useEffect, useCallback } from "react";
import authApi from "./authApi";

const AuthContext = createContext({});

export const AuthProvider = ({ children }) => {
    // Initialize with localStorage check to prevent flicker
    const [isAuthenticated, setAuthenticated] = useState(() => {
        return localStorage.getItem('access_token') !== null;
    });
    const [refreshAuth, setRefreshAuth] = useState(false);

    useEffect(() => {
        authApi.get("/api/v1/auth/login")
        .then((response) => {
            const isAuth = response.status === 200;
            setAuthenticated(isAuth);
        })
        .catch(() => {
            setAuthenticated(false);
        })
    }, [refreshAuth]);

    const triggerAuthCheck = useCallback(() => {
        setRefreshAuth(prev => !prev);
    }, []);

    return (
        <AuthContext.Provider value={{ isAuthenticated, setAuthenticated, triggerAuthCheck }}>
            {children}
        </AuthContext.Provider>
    );
};

export default AuthContext;