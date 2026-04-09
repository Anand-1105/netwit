import React, { createContext, useState, useEffect } from "react";
import { login as loginService, logout as logoutService, signup as signupService, checkAuth as checkAuthService } from "../Store/useAuthStore";
import { useNavigate } from "react-router-dom";
import { useToast } from "./ToastContext";

export const UserContext = createContext();

const UserProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const navigate = useNavigate();
    const { toast } = useToast();

    useEffect(() => {
        const verifyUser = async () => {
            setLoading(true);
            try {
                const response = await checkAuthService();
                if (response?.data?.authenticated) {
                    setUser(response.data.user);
                    setIsAuthenticated(true);
                } else {
                    setUser(null);
                    setIsAuthenticated(false);
                }
            } catch {
                setUser(null);
                setIsAuthenticated(false);
            } finally {
                setLoading(false);
            }
        };
        verifyUser();
    }, []);

    const login = async (credentials) => {
        setLoading(true);
        try {
            const response = await loginService(credentials);
            if (response.success) {
                setUser(response.user);
                setIsAuthenticated(true);
                toast('Logged in successfully', 'success');
                return;
            }
            toast(response.message || 'Login failed', 'error');
        } catch (error) {
            toast(typeof error === 'string' ? error : 'Login failed. Please try again.', 'error');
            throw error;
        } finally {
            setLoading(false);
        }
    };

    const logout = async () => {
        setLoading(true);
        try {
            await logoutService();
            setUser(null);
            setIsAuthenticated(false);
            navigate("/");
        } catch {
            toast('Failed to logout. Please try again.', 'error');
        } finally {
            setLoading(false);
        }
    };

    const signup = async (userData) => {
        setLoading(true);
        try {
            const response = await signupService(userData);
            setUser(response.data.user);
            toast('Account created successfully', 'success');
        } catch (error) {
            setError(error.message);
            throw error;
        } finally {
            setLoading(false);
        }
    };

    // Allow updating user profile locally after edit
    const updateUser = (updated) => setUser(prev => ({ ...prev, ...updated }));

    return (
        <UserContext.Provider value={{ user, updateUser, signup, isAuthenticated, loading, error, login, logout }}>
            {children}
        </UserContext.Provider>
    );
};

export default UserProvider;
