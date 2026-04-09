import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Axios from '../Api/Axios';
import { FiCalendar } from 'react-icons/fi';
import { useToast } from '../Context/ToastContext';

const Signup = () => {
    const navigate = useNavigate();
    const { toast } = useToast();
    const [form, setForm] = useState({ username: '', email: '', password: '', confirm: '' });
    const [errors, setErrors] = useState({});
    const [loading, setLoading] = useState(false);

    const validate = () => {
        const e = {};
        if (!form.username.trim() || form.username.length < 2) e.username = 'Min 2 characters';
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = 'Invalid email';
        if (form.password.length < 8) e.password = 'Min 8 characters';
        if (form.password !== form.confirm) e.confirm = 'Passwords do not match';
        setErrors(e);
        return Object.keys(e).length === 0;
    };

    const handleChange = (e) => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validate()) return;
        setLoading(true);
        try {
            await Axios.post('/auth/signup', {
                username: form.username.trim(),
                email: form.email.toLowerCase(),
                password: form.password,
                role: 'viewer',
            });
            toast('Account created — check your email for a welcome message', 'success');
            navigate('/login');
        } catch (err) {
            toast(err.response?.data?.message || 'Registration failed', 'error');
        } finally {
            setLoading(false);
        }
    };

    const field = (name, label, type = 'text', placeholder = '') => (
        <div>
            <label className="block text-xs text-white/50 mb-1.5">{label}</label>
            <input
                name={name}
                type={type}
                value={form[name]}
                onChange={handleChange}
                placeholder={placeholder}
                className="w-full px-3 py-2.5 bg-white/5 border border-white/10 rounded-md text-sm text-white placeholder-white/20 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
            />
            {errors[name] && <p className="text-xs text-red-400 mt-1">{errors[name]}</p>}
        </div>
    );

    return (
        <div className="min-h-screen bg-[#0f0f0f] flex flex-col items-center justify-center px-4">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-2 mb-10">
                <span className="w-7 h-7 bg-amber-500 rounded flex items-center justify-center">
                    <FiCalendar size={14} className="text-black" />
                </span>
                <span className="text-white font-bold tracking-tight">MeetApp</span>
            </Link>

            {/* Card */}
            <div className="w-full max-w-sm bg-[#1a1a1a] border border-white/10 rounded-xl p-8">
                <h1 className="text-lg font-bold text-white mb-1">Create account</h1>
                <p className="text-white/40 text-sm mb-7">Join MeetApp to manage conference bookings</p>

                <form onSubmit={handleSubmit} className="space-y-4" noValidate>
                    {field('username', 'Username', 'text', 'yourname')}
                    {field('email', 'Email', 'email', 'you@company.com')}
                    {field('password', 'Password', 'password', '••••••••')}
                    {field('confirm', 'Confirm Password', 'password', '••••••••')}

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-black text-sm font-semibold py-2.5 rounded-md transition-colors mt-2"
                    >
                        {loading ? 'Creating account...' : 'Create account'}
                    </button>
                </form>

                <p className="text-center text-xs text-white/30 mt-6">
                    Already have an account?{' '}
                    <Link to="/login" className="text-amber-500 hover:text-amber-400 transition-colors">
                        Sign in
                    </Link>
                </p>
            </div>

            <p className="text-white/20 text-xs mt-6">India CIO Summit · Conference Room Booking</p>
        </div>
    );
};

export default Signup;
