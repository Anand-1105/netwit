import React, { useState, useEffect } from 'react';
import Axios from '../Api/Axios';
import { FiX } from 'react-icons/fi';

const inp = (err) => `w-full px-3 py-2.5 bg-white/5 border ${err ? 'border-red-500/50' : 'border-white/10'} rounded-md text-sm text-white placeholder-white/20 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500`;
const lbl = 'block text-xs text-white/50 mb-1.5';

const SignUp2 = ({ eventId, onSuccess, onClose }) => {
    const [form, setForm] = useState({ username: '', email: '', password: '', confirmPassword: '', role: 'viewer' });
    const [errors, setErrors] = useState({});
    const [submitting, setSubmitting] = useState(false);
    const [errorMsg, setErrorMsg] = useState(null);

    // Escape key closes the modal
    useEffect(() => {
        if (!onClose) return;
        const handler = (e) => { if (e.key === 'Escape') onClose(); };
        document.addEventListener('keydown', handler);
        return () => document.removeEventListener('keydown', handler);
    }, [onClose]);

    const validate = () => {
        const e = {};
        if (!form.username.trim() || form.username.length < 2) e.username = 'Min 2 characters';
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = 'Invalid email';
        if (form.password.length < 6) e.password = 'Min 6 characters';
        if (form.password !== form.confirmPassword) e.confirmPassword = 'Passwords must match';
        if (!['viewer', 'manager'].includes(form.role)) e.role = 'Invalid role';
        setErrors(e);
        return Object.keys(e).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validate()) return;
        setSubmitting(true);
        setErrorMsg(null);
        try {
            const { confirmPassword, ...data } = form;
            await Axios.post('/auth/signup', eventId ? { ...data, eventId } : data);
            if (onSuccess) onSuccess();
        } catch (err) {
            setErrorMsg(err.response?.data?.message || 'Registration failed');
        } finally {
            setSubmitting(false);
        }
    };

    const set = (name) => (e) => setForm(f => ({ ...f, [name]: e.target.value }));

    return (
        <div className="bg-[#1a1a1a] p-6 rounded-xl w-full relative">
            {/* Close button */}
            {onClose && (
                <button onClick={onClose} className="absolute top-4 right-4 text-white/30 hover:text-white transition-colors z-10">
                    <FiX size={16} />
                </button>
            )}

            <h2 className="text-base font-bold text-white mb-1">Add User</h2>
            <p className="text-xs text-white/40 mb-5">Create a new account{eventId ? ' and assign to this event' : ''}</p>

            {errorMsg && (
                <p className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded px-3 py-2 mb-4">{errorMsg}</p>
            )}

            <form onSubmit={handleSubmit} className="space-y-3" noValidate>
                <div>
                    <label className={lbl}>Username</label>
                    <input type="text" value={form.username} onChange={set('username')} placeholder="yourname" className={inp(errors.username)} />
                    {errors.username && <p className="text-red-400 text-xs mt-1">{errors.username}</p>}
                </div>
                <div>
                    <label className={lbl}>Email</label>
                    <input type="email" value={form.email} onChange={set('email')} placeholder="you@company.com" className={inp(errors.email)} />
                    {errors.email && <p className="text-red-400 text-xs mt-1">{errors.email}</p>}
                </div>
                <div>
                    <label className={lbl}>Password</label>
                    <input type="password" value={form.password} onChange={set('password')} placeholder="••••••••" className={inp(errors.password)} />
                    {errors.password && <p className="text-red-400 text-xs mt-1">{errors.password}</p>}
                </div>
                <div>
                    <label className={lbl}>Confirm Password</label>
                    <input type="password" value={form.confirmPassword} onChange={set('confirmPassword')} placeholder="••••••••" className={inp(errors.confirmPassword)} />
                    {errors.confirmPassword && <p className="text-red-400 text-xs mt-1">{errors.confirmPassword}</p>}
                </div>
                <div>
                    <label className={lbl}>Role</label>
                    <select value={form.role} onChange={set('role')} className={inp(errors.role) + ' cursor-pointer'}>
                        <option value="viewer">Viewer</option>
                        <option value="manager">Manager</option>
                    </select>
                </div>
                <div className="flex gap-2 pt-2">
                    {onClose && (
                        <button type="button" onClick={onClose}
                            className="flex-1 py-2.5 text-xs border border-white/10 rounded-md text-white/40 hover:text-white transition-colors">
                            Cancel
                        </button>
                    )}
                    <button type="submit" disabled={submitting}
                        className="flex-1 bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-black text-xs font-semibold py-2.5 rounded-md transition-colors">
                        {submitting ? 'Creating...' : 'Create Account'}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default SignUp2;
