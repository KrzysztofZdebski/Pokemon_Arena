import { createContext, useState, useEffect } from "react";
import authApi from "./authApi"; // Adjust the import path as necessary

const AuthContext = createContext({});

export const AuthProvider = ({ children }) => {
    const [isAuthenticated, setAuthenticated] = useState(false);
    const [refreshAuth, setRefreshAuth] = useState(false); // Add refresh state

    useEffect(() => {
        authApi.get("/api/v1/auth/login")
        .then((response) => {
            setAuthenticated(response.status === 200); // Set authenticated state based on the response
        })
        .catch(() => {
            setAuthenticated(false);
        })
        .finally(() => {
        });
    }, [refreshAuth]); // Add refreshAuth to dependencies


    // Expose setRefreshAuth so you can trigger a re-check from anywhere
    const triggerAuthCheck = () => setRefreshAuth(prev => !prev);

    return (
        <AuthContext.Provider value={{ isAuthenticated, setAuthenticated, triggerAuthCheck }}>
            {children}
        </AuthContext.Provider>
    );
};

export default AuthContext;