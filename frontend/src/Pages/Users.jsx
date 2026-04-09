import React, { useState, useEffect, useContext } from 'react';
import Axios from '../Api/Axios';
import { UserContext } from '../Context/UserContext';
import { useToast } from '../Context/ToastContext';
import { FiTrash2, FiUserPlus, FiUser, FiX } from 'react-icons/fi';

const Users = () => {
  const { user } = useContext(UserContext);
  const { toast } = useToast();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddUser, setShowAddUser] = useState(false);
  const [newUser, setNewUser] = useState({ username: '', email: '', password: '', role: 'viewer' });

  useEffect(() => { fetchUsers(); }, []);

  const fetchUsers = async () => {
    try {
      const r = await Axios.get('/users');
      setUsers(r.data);
    } catch { toast('Failed to load users', 'error'); }
    finally { setLoading(false); }
  };

  const handleAdd = async (e) => {
    e.preventDefault();
    try {
      await Axios.post('/auth/signup', newUser);
      setShowAddUser(false);
      setNewUser({ username: '', email: '', password: '', role: 'viewer' });
      fetchUsers();
      toast('User created', 'success');
    } catch (err) { toast(err.response?.data?.message || 'Failed to add user', 'error'); }
  };

  const handleDelete = async (userId) => {
    try {
      await Axios.delete(`/users/${userId}`);
      fetchUsers();
      toast('User deleted', 'success');
    } catch { toast('Failed to delete user', 'error'); }
  };

  const inp = 'w-full px-3 py-2 bg-white/5 border border-white/10 rounded-md text-sm text-white placeholder-white/20 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500';
  const lbl = 'block text-xs text-white/50 mb-1.5';

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-amber-500" />
    </div>
  );

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-xl font-bold text-white">User Management</h1>
          <p className="text-white/40 text-sm mt-0.5">{users.length} users</p>
        </div>
        {user?.role === 'admin' && (
          <button onClick={() => setShowAddUser(true)}
            className="flex items-center gap-2 bg-amber-500 hover:bg-amber-400 text-black text-sm font-semibold px-4 py-2 rounded-md transition-colors">
            <FiUserPlus size={14} /> Add User
          </button>
        )}
      </div>

      {showAddUser && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-[#1a1a1a] border border-white/10 rounded-xl w-full max-w-md p-6">
            <div className="flex justify-between items-center mb-5">
              <h2 className="font-semibold text-white text-sm">Add New User</h2>
              <button onClick={() => setShowAddUser(false)} className="text-white/40 hover:text-white"><FiX size={16} /></button>
            </div>
            <form onSubmit={handleAdd} className="space-y-4">
              {[['username','Username','text','yourname'],['email','Email','email','you@company.com'],['password','Password','password','••••••••']].map(([name,label,type,ph]) => (
                <div key={name}>
                  <label className={lbl}>{label}</label>
                  <input type={type} placeholder={ph} value={newUser[name]} onChange={e => setNewUser(p => ({...p,[name]:e.target.value}))} className={inp} required />
                </div>
              ))}
              <div>
                <label className={lbl}>Role</label>
                <select value={newUser.role} onChange={e => setNewUser(p => ({...p,role:e.target.value}))}
                  className={inp + ' cursor-pointer'}>
                  <option value="viewer">Viewer</option>
                  <option value="manager">Manager</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setShowAddUser(false)}
                  className="px-4 py-2 text-xs border border-white/10 rounded-md text-white/50 hover:text-white transition-colors">Cancel</button>
                <button type="submit"
                  className="px-4 py-2 text-xs bg-amber-500 hover:bg-amber-400 text-black font-semibold rounded-md transition-colors">Add User</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="bg-[#1a1a1a] border border-white/10 rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/5 bg-white/5">
              {['Name','Email','Role','Events',''].map(h => (
                <th key={h} className="text-left px-4 py-3 text-[10px] font-semibold text-white/30 uppercase tracking-wider">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {users.map(u => (
              <tr key={u._id} className="hover:bg-white/5 transition-colors">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-amber-500/20 border border-amber-500/30 flex items-center justify-center flex-shrink-0">
                      <span className="text-xs font-bold text-amber-400">{u.username?.[0]?.toUpperCase()}</span>
                    </div>
                    <span className="text-white/80 font-medium">{u.username}</span>
                  </div>
                </td>
                <td className="px-4 py-3 text-white/40 text-xs">{u.email}</td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-0.5 rounded text-xs font-medium ${u.role === 'admin' ? 'bg-amber-500/20 text-amber-400' : u.role === 'manager' ? 'bg-blue-500/20 text-blue-400' : 'bg-white/10 text-white/50'}`}>
                    {u.role}
                  </span>
                </td>
                <td className="px-4 py-3">
                  {u.events?.length > 0 ? (
                    <div className="flex flex-wrap gap-1">
                      {u.events.map(ev => (
                        <span key={ev._id} className="text-xs bg-white/5 border border-white/10 text-white/50 px-2 py-0.5 rounded">{ev.title}</span>
                      ))}
                    </div>
                  ) : <span className="text-white/20 text-xs">No events</span>}
                </td>
                <td className="px-4 py-3 text-right">
                  {user?.role === 'admin' && u._id !== user?._id && (
                    <button onClick={() => handleDelete(u._id)}
                      className="text-white/20 hover:text-red-400 transition-colors p-1">
                      <FiTrash2 size={14} />
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Users;
