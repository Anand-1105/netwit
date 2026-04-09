import React, { useContext, useState, useRef, useEffect } from 'react';
import { NavLink, Link, useNavigate, useParams } from 'react-router-dom';
import { UserContext } from '../Context/UserContext';
import { useToast } from '../Context/ToastContext';
import Axios from '../Api/Axios';
import {
    FiGrid, FiCalendar, FiUsers, FiBriefcase,
    FiBookOpen, FiLogOut, FiUser, FiPlus, FiEdit2, FiX
} from 'react-icons/fi';

const NavItem = ({ to, icon: Icon, label, end = false }) => (
    <NavLink
        to={to}
        end={end}
        className={({ isActive }) =>
            `flex items-center gap-3 px-3 py-2 rounded text-sm transition-colors ${
                isActive
                    ? 'bg-white/10 text-white font-medium'
                    : 'text-white/40 hover:text-white/80 hover:bg-white/5'
            }`
        }
    >
        <Icon size={14} />
        {label}
    </NavLink>
);

const EditProfileModal = ({ user, onClose, onSave }) => {
    const [username, setUsername] = useState(user?.username || '');
    const [saving, setSaving] = useState(false);
    const [tab, setTab] = useState('profile');
    const { toast } = useToast();

    const handleSave = async (e) => {
        e.preventDefault();
        if (!username.trim()) return toast('Username is required', 'warning');
        setSaving(true);
        try {
            const res = await Axios.put('/auth/profile', { username: username.trim() });
            onSave({ username: res.data.user.username });
            toast('Profile updated', 'success');
            onClose();
        } catch (err) {
            toast(err.response?.data?.message || 'Failed to update profile', 'error');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
            <div className="bg-[#1a1a1a] border border-white/10 rounded-xl w-full max-w-md">
                <div className="flex items-center justify-between px-5 py-4 border-b border-white/10">
                    <h2 className="font-semibold text-white text-sm">Edit Profile</h2>
                    <button onClick={onClose} className="text-white/40 hover:text-white transition-colors">
                        <FiX size={16} />
                    </button>
                </div>

                <div className="flex border-b border-white/10">
                    {['profile', 'password'].map(t => (
                        <button key={t} onClick={() => setTab(t)}
                            className={`flex-1 py-2.5 text-xs font-medium capitalize transition-colors ${
                                tab === t ? 'text-amber-400 border-b border-amber-400' : 'text-white/40 hover:text-white/70'
                            }`}
                        >{t}</button>
                    ))}
                </div>

                <div className="p-5">
                    {tab === 'profile' ? (
                        <form onSubmit={handleSave} className="space-y-4">
                            <div>
                                <label className="block text-xs text-white/50 mb-1.5">Username</label>
                                <input
                                    value={username}
                                    onChange={e => setUsername(e.target.value)}
                                    className="w-full px-3 py-2 text-sm bg-white/5 border border-white/10 rounded-md text-white focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
                                />
                            </div>
                            <div>
                                <label className="block text-xs text-white/50 mb-1.5">Email</label>
                                <input value={user?.email} disabled
                                    className="w-full px-3 py-2 text-sm bg-white/5 border border-white/10 rounded-md text-white/30 cursor-not-allowed" />
                                <p className="text-xs text-white/30 mt-1">Email cannot be changed</p>
                            </div>
                            <div>
                                <label className="block text-xs text-white/50 mb-1.5">Role</label>
                                <input value={user?.role} disabled
                                    className="w-full px-3 py-2 text-sm bg-white/5 border border-white/10 rounded-md text-white/30 cursor-not-allowed capitalize" />
                            </div>
                            <div className="flex justify-end gap-2 pt-1">
                                <button type="button" onClick={onClose}
                                    className="px-4 py-2 text-xs border border-white/10 rounded-md text-white/50 hover:text-white hover:border-white/20 transition-colors">
                                    Cancel
                                </button>
                                <button type="submit" disabled={saving}
                                    className="px-4 py-2 text-xs bg-amber-500 hover:bg-amber-400 text-black font-semibold rounded-md disabled:opacity-50 transition-colors">
                                    {saving ? 'Saving...' : 'Save'}
                                </button>
                            </div>
                        </form>
                    ) : (
                        <div className="space-y-4">
                            <p className="text-sm text-white/50 leading-relaxed">
                                To change your password, sign out and use <span className="text-white/80">"Forgot password?"</span> on the login page.
                            </p>
                            <div className="bg-amber-500/10 border border-amber-500/20 rounded-md px-4 py-3 text-xs text-amber-400">
                                Sign out → Login → "Forgot password?" → OTP sent to your email
                            </div>
                            <div className="flex justify-end">
                                <button onClick={onClose}
                                    className="px-4 py-2 text-xs border border-white/10 rounded-md text-white/50 hover:text-white transition-colors">
                                    Close
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

const Sidebar = () => {
    const { user, isAuthenticated, logout, updateUser } = useContext(UserContext);
    const { id } = useParams();
    const navigate = useNavigate();
    const [profileMenuOpen, setProfileMenuOpen] = useState(false);
    const [editOpen, setEditOpen] = useState(false);
    const menuRef = useRef(null);

    useEffect(() => {
        const handler = (e) => {
            if (menuRef.current && !menuRef.current.contains(e.target)) setProfileMenuOpen(false);
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    return (
        <>
            <aside
                className="fixed top-0 left-0 h-screen bg-[#0f0f0f] border-r border-white/5 flex flex-col z-40"
                style={{ width: 'var(--sidebar-width)' }}
            >
                {/* Logo */}
                <Link to={isAuthenticated ? "/app" : "/"}
                    className="px-4 py-5 border-b border-white/5 flex items-center gap-2 hover:bg-white/5 transition-colors">
                    <span className="w-6 h-6 bg-amber-500 rounded flex items-center justify-center flex-shrink-0">
                        <FiCalendar size={12} className="text-black" />
                    </span>
                    <span className="text-sm font-bold text-white tracking-tight">MeetApp</span>
                </Link>

                {/* Nav */}
                <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
                    <p className="text-[10px] font-semibold text-white/20 uppercase tracking-wider px-3 mb-2">Main</p>
                    <NavItem to="/app" end icon={FiCalendar} label="Events" />
                    <NavItem to="/app/dashboard" icon={FiGrid} label="Dashboard" />
                    {user?.role === 'admin' && (
                        <NavItem to="/app/users" icon={FiUsers} label="Users" />
                    )}

                    {id && (
                        <>
                            <p className="text-[10px] font-semibold text-white/20 uppercase tracking-wider px-3 mt-5 mb-2">This Event</p>
                            <NavItem to={`/app/event/${id}`} end icon={FiBookOpen} label="Attendees" />
                            <NavItem to={`/app/event/${id}/meeting`} icon={FiCalendar} label="Bookings" />
                            <NavItem to={`/app/event/${id}/company`} icon={FiBriefcase} label="Companies" />
                        </>
                    )}

                    {user?.role === 'admin' && (
                        <>
                            <p className="text-[10px] font-semibold text-white/20 uppercase tracking-wider px-3 mt-5 mb-2">Actions</p>
                            <button onClick={() => navigate('/app/create')}
                                className="flex items-center gap-3 px-3 py-2 rounded text-sm text-white/40 hover:text-white/80 hover:bg-white/5 transition-colors w-full text-left">
                                <FiPlus size={14} />
                                New Event
                            </button>
                        </>
                    )}
                </nav>

                {/* Footer — profile if logged in, sign in if not */}
                <div className="px-3 py-3 border-t border-white/5 relative" ref={menuRef}>
                    {isAuthenticated && user ? (
                        <>
                            <button onClick={() => setProfileMenuOpen(o => !o)}
                                className="flex items-center gap-2.5 px-2 py-2 w-full rounded hover:bg-white/5 transition-colors group">
                                <div className="w-7 h-7 rounded-full bg-amber-500/20 border border-amber-500/30 flex items-center justify-center flex-shrink-0">
                                    <span className="text-xs font-bold text-amber-400">
                                        {user.username?.[0]?.toUpperCase()}
                                    </span>
                                </div>
                                <div className="flex-1 min-w-0 text-left">
                                    <p className="text-xs font-medium text-white/80 truncate">{user.username}</p>
                                    <p className="text-[10px] text-white/30 capitalize">{user.role}</p>
                                </div>
                                <FiEdit2 size={11} className="text-white/20 group-hover:text-white/40 flex-shrink-0 transition-colors" />
                            </button>

                            {profileMenuOpen && (
                                <div className="absolute bottom-full left-3 right-3 mb-1 bg-[#1a1a1a] border border-white/10 rounded-lg overflow-hidden shadow-xl">
                                    <div className="px-4 py-3 border-b border-white/5">
                                        <p className="text-xs font-medium text-white/80">{user.username}</p>
                                        <p className="text-[10px] text-white/30 mt-0.5">{user.email}</p>
                                    </div>
                                    <button onClick={() => { setEditOpen(true); setProfileMenuOpen(false); }}
                                        className="flex items-center gap-2 w-full px-4 py-2.5 text-xs text-white/60 hover:text-white hover:bg-white/5 transition-colors">
                                        <FiEdit2 size={12} /> Edit Profile
                                    </button>
                                    <div className="border-t border-white/5" />
                                    <button onClick={() => { logout(); setProfileMenuOpen(false); }}
                                        className="flex items-center gap-2 w-full px-4 py-2.5 text-xs text-red-400 hover:text-red-300 hover:bg-red-500/5 transition-colors">
                                        <FiLogOut size={12} /> Sign out
                                    </button>
                                </div>
                            )}
                        </>
                    ) : (
                        <button onClick={() => navigate('/login')}
                            className="flex items-center gap-2.5 px-2 py-2 w-full rounded hover:bg-white/5 transition-colors">
                            <div className="w-7 h-7 rounded-full bg-white/5 border border-white/10 flex items-center justify-center flex-shrink-0">
                                <FiUser size={12} className="text-white/30" />
                            </div>
                            <span className="text-xs text-white/40 hover:text-white/70 transition-colors">Sign in</span>
                        </button>
                    )}
                </div>
            </aside>

            {editOpen && (
                <EditProfileModal
                    user={user}
                    onClose={() => setEditOpen(false)}
                    onSave={(updated) => updateUser(updated)}
                />
            )}
        </>
    );
};

export default Sidebar;
