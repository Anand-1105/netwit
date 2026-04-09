import React, { useState } from 'react';
import Axios from '../Api/Axios';

const SignUp2 = ({ eventId, onSuccess }) => {
    const [formData, setFormData] = useState({
        username: '',
        email: '',
        password: '',
        confirmPassword: '',
        role: 'viewer'
    });    const [errors, setErrors] = useState({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [errorMessage, setErrorMessage] = useState(null);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const validate = () => {
        const newErrors = {};
        
        if (!formData.username.trim()) {
            newErrors.username = 'Username is required';
        } else if (formData.username.length < 2) {
            newErrors.username = 'Username must be at least 2 characters';
        } else if (formData.username.length > 50) {
            newErrors.username = 'Username cannot be longer than 50 characters';
        }
        
        if (!formData.email) {
            newErrors.email = 'Email is required';
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
            newErrors.email = 'Invalid email address';
        }
        
        if (!formData.password) {
            newErrors.password = 'Password is required';
        } else if (formData.password.length < 6) {
            newErrors.password = 'Password must be at least 6 characters';
        } else if (formData.password.length > 20) {
            newErrors.password = 'Password cannot be longer than 20 characters';
        }
        
        if (formData.password !== formData.confirmPassword) {
            newErrors.confirmPassword = 'Passwords must match';
        }
        
        if (!['viewer', 'manager'].includes(formData.role)) {
            newErrors.role = 'Invalid role';
        }
        
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!validate()) return;
        
        setIsSubmitting(true);
        setErrorMessage(null);
        
        try {
            const { confirmPassword, ...signupData } = formData;
            const payload = eventId ? { ...signupData, eventId } : signupData;
            
            const response = await Axios.post('/auth/signup', payload);
            
            if (response.status === 200 || response.status === 201) {
                if (onSuccess) onSuccess();
            }
        } catch (error) {
            console.error("Signup error:", error);
            setErrorMessage(error.response?.data?.message || 'Registration failed');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
            <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md border border-gray-100">
                <div className="flex justify-center mb-6">
                    <div className="w-16 h-16 rounded-full bg-blue-50 flex items-center justify-center">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 11c0 3.517-1.009 6.799-2.753 9.571m-3.44-2.04l.054-.09A13.916 13.916 0 008 11a4 4 0 118 0c0 1.017-.07 2.019-.203 3m-2.118 6.844A21.88 21.88 0 0015.171 17m3.839 1.132c.645-2.266.99-4.659.99-7.132A8 8 0 008 4.07M3 15.364c.64-1.319 1-2.8 1-4.364 0-1.457.39-2.823 1.07-4" />
                        </svg>
                    </div>
                </div>
                <h2 className="text-3xl font-bold text-gray-800 mb-2 text-center">Create Account</h2>
                <p className="text-gray-500 text-center mb-8">Join us to get started</p>
                
                {errorMessage && (
                    <div className="mb-4 p-4 bg-red-50 border-l-4 border-red-500">
                        <div className="flex">
                            <div className="flex-shrink-0">
                                <svg className="h-5 w-5 text-red-500" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                                </svg>
                            </div>
                            <div className="ml-3">
                                <p className="text-sm text-red-700">{errorMessage}</p>
                            </div>
                        </div>
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-5" noValidate>
                    <div>
                        <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-1">Username</label>
                        <input
                            type="text"
                            id="username"
                            name="username"
                            value={formData.username}
                            onChange={handleChange}
                            placeholder="Enter your username"
                            className={`mt-1 block w-full px-4 py-3 rounded-lg border ${errors.username ? 'border-red-300' : 'border-gray-300'} focus:ring-2 focus:ring-blue-200 focus:border-blue-500 transition duration-200`}
                        />
                        {errors.username && <div className="text-red-500 text-xs mt-1">{errors.username}</div>}
                    </div>
                    
                    <div>
                        <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                        <input
                            type="email"
                            id="email"
                            name="email"
                            value={formData.email}
                            onChange={handleChange}
                            placeholder="your@email.com"
                            className={`mt-1 block w-full px-4 py-3 rounded-lg border ${errors.email ? 'border-red-300' : 'border-gray-300'} focus:ring-2 focus:ring-blue-200 focus:border-blue-500 transition duration-200`}
                        />
                        {errors.email && <div className="text-red-500 text-xs mt-1">{errors.email}</div>}
                    </div>
                    
                    <div>
                        <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                        <input
                            type="password"
                            id="password"
                            name="password"
                            value={formData.password}
                            onChange={handleChange}
                            placeholder="••••••••"
                            className={`mt-1 block w-full px-4 py-3 rounded-lg border ${errors.password ? 'border-red-300' : 'border-gray-300'} focus:ring-2 focus:ring-blue-200 focus:border-blue-500 transition duration-200`}
                        />
                        {errors.password && <div className="text-red-500 text-xs mt-1">{errors.password}</div>}
                    </div>
                    
                    <div>
                        <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">Confirm Password</label>
                        <input
                            type="password"
                            id="confirmPassword"
                            name="confirmPassword"
                            value={formData.confirmPassword}
                            onChange={handleChange}
                            placeholder="••••••••"
                            className={`mt-1 block w-full px-4 py-3 rounded-lg border ${errors.confirmPassword ? 'border-red-300' : 'border-gray-300'} focus:ring-2 focus:ring-blue-200 focus:border-blue-500 transition duration-200`}
                        />
                        {errors.confirmPassword && <div className="text-red-500 text-xs mt-1">{errors.confirmPassword}</div>}
                    </div>
                    
                    <div>
                        <label htmlFor="role" className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                        <select
                            id="role"
                            name="role"
                            value={formData.role}
                            onChange={handleChange}
                            className={`mt-1 block w-full px-4 py-3 rounded-lg border ${errors.role ? 'border-red-300' : 'border-gray-300'} focus:ring-2 focus:ring-blue-200 focus:border-blue-500 transition duration-200`}
                        >
                            <option value="viewer">Viewer</option>
                            <option value="manager">Manager</option>
                        </select>
                        {errors.role && <div className="text-red-500 text-xs mt-1">{errors.role}</div>}
                    </div>
                    
                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className={`w-full py-3 px-4 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white font-medium rounded-lg shadow-md focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 transition duration-200 ${isSubmitting ? 'opacity-70 cursor-not-allowed' : ''}`}
                    >
                        {isSubmitting ? (
                            <span className="flex items-center justify-center">
                                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                Creating account...
                            </span>
                        ) : 'Create Account'}
                    </button>
                </form>
                
                <p className="mt-6 text-center text-sm text-gray-500">
                    Already have an account?{' '}
                    <a href="/login" className="font-medium text-blue-600 hover:text-blue-500">
                        Sign in
                    </a>
                </p>
            </div>
        </div>
    );
};

export default SignUp2;