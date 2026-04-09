import React, { useEffect, useState, useContext } from "react";
import Select from "react-select";
import Axios from "../Api/Axios";
import { useNavigate } from "react-router-dom";
import { FiX, FiPlus } from "react-icons/fi";
import SignUp2 from "./Signup2";
import { UserContext } from "../Context/UserContext";

const darkSelect = {
  control: (p, s) => ({ ...p, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '6px', boxShadow: 'none', '&:hover': { borderColor: '#f59e0b' }, borderColor: s.isFocused ? '#f59e0b' : 'rgba(255,255,255,0.1)' }),
  menu: (p) => ({ ...p, background: '#1a1a1a', border: '1px solid rgba(255,255,255,0.1)' }),
  option: (p, s) => ({ ...p, background: s.isFocused ? 'rgba(255,255,255,0.05)' : 'transparent', color: '#e8e8e8', fontSize: '13px' }),
  multiValue: (p) => ({ ...p, background: 'rgba(245,158,11,0.15)', borderRadius: '4px' }),
  multiValueLabel: (p) => ({ ...p, color: '#f59e0b', fontSize: '12px' }),
  multiValueRemove: (p) => ({ ...p, color: '#f59e0b', '&:hover': { background: 'rgba(245,158,11,0.2)', color: '#f59e0b' } }),
  input: (p) => ({ ...p, color: '#e8e8e8' }),
  placeholder: (p) => ({ ...p, color: 'rgba(255,255,255,0.2)', fontSize: '13px' }),
  singleValue: (p) => ({ ...p, color: '#e8e8e8' }),
};

const inp = 'w-full px-3 py-2.5 bg-white/5 border border-white/10 rounded-md text-sm text-white placeholder-white/20 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500';
const lbl = 'block text-xs text-white/50 mb-1.5';

const CreateEvent = () => {
  const [title, setTitle] = useState("");
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState("");
  const [description, setDescription] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [assignedTo, setAssignedTo] = useState([]);
  const [slotGap, setSlotGap] = useState("");
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showSignupModal, setShowSignupModal] = useState(false);
  const navigate = useNavigate();
  const { user } = useContext(UserContext);

  useEffect(() => { fetchUsers(); }, []);

  const fetchUsers = () => {
    Axios.post("/auth/users-list").then(r => setUsers(r.data.users || [])).catch(() => setUsers([]));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (!title || assignedTo.length === 0) { setError("Title and Assigned To are required."); return; }
    if (startDate && endDate && new Date(endDate) <= new Date(startDate)) { setError("End date must be after start date."); return; }
    setLoading(true);
    try {
      const fd = new FormData();
      fd.append("title", title);
      if (imageFile) fd.append("image", imageFile);
      fd.append("description", description);
      fd.append("startDate", startDate);
      fd.append("endDate", endDate);
      fd.append("slotGap", slotGap);
      assignedTo.forEach(u => fd.append("assignedTo", u.value));
      await Axios.post("/events", fd, { headers: { "Content-Type": "multipart/form-data" } });
      navigate("/app");
    } catch (err) { setError(err?.response?.data?.error || "Something went wrong"); }
    finally { setLoading(false); }
  };

  const userOptions = users.map(u => ({ value: u._id, label: `${u.username} (${u.email})` }));
  const slotOpts = [{ value: 15, label: '15 min' }, { value: 20, label: '20 min' }, { value: 30, label: '30 min' }];

  return (
    <div className="max-w-2xl mx-auto py-10 px-4">
      <h1 className="text-xl font-bold text-white mb-6">Create Event</h1>
      <form onSubmit={handleSubmit} className="space-y-5 bg-[#1a1a1a] border border-white/10 rounded-xl p-6">
        {error && <p className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded px-3 py-2">{error}</p>}

        <div><label className={lbl}>Title</label><input value={title} onChange={e => setTitle(e.target.value)} className={inp} required /></div>

        <div>
          <label className={lbl}>Event Image</label>
          <input type="file" accept="image/*" onChange={e => { const f = e.target.files[0]; if(f){setImageFile(f); const r=new FileReader(); r.onloadend=()=>setImagePreview(r.result); r.readAsDataURL(f);}}}
            className="w-full text-xs text-white/40 file:mr-3 file:py-2 file:px-3 file:rounded file:border-0 file:text-xs file:bg-white/10 file:text-white/60 hover:file:bg-white/20 cursor-pointer" />
          {imagePreview && <img src={imagePreview} alt="Preview" className="mt-2 h-32 object-cover rounded border border-white/10" />}
        </div>

        <div><label className={lbl}>Description</label><textarea value={description} onChange={e => setDescription(e.target.value)} rows={3} className={inp + ' resize-none'} /></div>

        <div className="flex gap-4">
          <div className="flex-1">
            <label className={lbl}>Start Date</label>
            <input type="datetime-local" value={startDate} onChange={e => { setStartDate(e.target.value); if(endDate && new Date(endDate) <= new Date(e.target.value)) setEndDate(""); }} className={inp + ' [color-scheme:dark]'} />
          </div>
          <div className="flex-1">
            <label className={lbl}>End Date</label>
            <input type="datetime-local" value={endDate} min={startDate || undefined} onChange={e => setEndDate(e.target.value)} className={inp + ' [color-scheme:dark]'} />
          </div>
        </div>

        <div>
          <div className="flex justify-between items-center mb-1.5">
            <label className={lbl.replace('mb-1.5','')}>Assign To</label>
            <button type="button" onClick={() => setShowSignupModal(true)} className="text-xs text-amber-500 hover:text-amber-400 flex items-center gap-1"><FiPlus size={12} /> Add User</button>
          </div>
          <Select isMulti value={assignedTo} onChange={v => setAssignedTo(v||[])} options={userOptions} styles={darkSelect} placeholder="Select users..." closeMenuOnSelect={false} isSearchable isClearable />
        </div>

        <div>
          <label className={lbl}>Slot Gap</label>
          <select value={slotGap} onChange={e => setSlotGap(e.target.value)} className={inp + ' cursor-pointer'} required>
            <option value="">Select Slot Gap</option>
            {slotOpts.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </div>

        <button type="submit" disabled={loading}
          className="w-full bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-black text-sm font-semibold py-2.5 rounded-md transition-colors">
          {loading ? "Creating..." : "Create Event"}
        </button>
      </form>

      {showSignupModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-[#1a1a1a] border border-white/10 rounded-xl w-full max-w-md relative max-h-[90vh] overflow-y-auto">
            <button onClick={() => setShowSignupModal(false)} className="absolute top-4 right-4 text-white/40 hover:text-white z-10"><FiX size={18} /></button>
            <SignUp2 onSuccess={() => { setShowSignupModal(false); fetchUsers(); }} />
          </div>
        </div>
      )}
    </div>
  );
};

export default CreateEvent;
