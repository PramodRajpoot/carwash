import React, { createContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../services/api';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        loadUser();
    }, []);

    const loadUser = async () => {
        try {
            const storedToken = await AsyncStorage.getItem('userToken');
            if (storedToken) {
                setToken(storedToken);
                api.defaults.headers.common['Authorization'] = `Bearer ${storedToken}`;
                
                // Optional: Validate token with backend /auth/me
                try {
                    const response = await api.get('/auth/me');
                    setUser(response.data);
                } catch (e) {
                    // Token might be invalid/expired
                    console.error("Token validation failed", e);
                    logout();
                }
            }
        } catch (e) {
            console.error("Failed to load user from storage", e);
        } finally {
            setIsLoading(false);
        }
    };

    const login = async (email, password) => {
        try {
            const response = await api.post('/auth/login', { email, password });
            
            // Assuming response contains token and user object. 
            // Adapt based on actual API response structure
            const newToken = response.data.token || response.data.access_token;
            const userData = response.data.user;

            if (newToken) {
                await AsyncStorage.setItem('userToken', newToken);
                setToken(newToken);
                setUser(userData);
                api.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;
                return { success: true };
            } else {
                return { success: false, message: "Invalid response from server." };
            }
        } catch (e) {
            const message = e.response?.data?.message || 'Login failed';
            return { success: false, message };
        }
    };

    const register = async (name, email, password, password_confirmation, phone) => {
        try {
            const response = await api.post('/auth/register', { 
                name, 
                email, 
                password, 
                password_confirmation,
                phone 
            });
            
            const newToken = response.data.token || response.data.access_token;
            const userData = response.data.user;

            if (newToken) {
                await AsyncStorage.setItem('userToken', newToken);
                setToken(newToken);
                setUser(userData);
                api.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;
                return { success: true };
            } else {
                return { success: false, message: "Invalid response from server." };
            }
        } catch (e) {
            const message = e.response?.data?.message || 'Registration failed';
            return { success: false, message };
        }
    };

    const logout = async () => {
        try {
            if (token) {
                await api.post('/auth/logout');
            }
        } catch (e) {
            console.error('Logout error on server', e);
        } finally {
            await AsyncStorage.removeItem('userToken');
            setToken(null);
            setUser(null);
            delete api.defaults.headers.common['Authorization'];
        }
    };

    return (
        <AuthContext.Provider value={{ user, token, isLoading, login, register, logout }}>
            {children}
        </AuthContext.Provider>
    );
};
