import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Select from "react-select";
import Axios from "../Api/Axios";

const darkSelect = {
  control: (p, s) => ({ ...p, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '6px', boxShadow: 'none', borderColor: s.isFocused ? '#f59e0b' : 'rgba(255,255,255,0.1)' }),
  menu: (p) => ({ ...p, background: '#1a1a1a', border: '1px solid rgba(255,255,255,0.1)' }),
  option: (p, s) => ({ ...p, background: s.isFocused ? 'rgba(255,255,255,0.05)' : 'transparent', color: '#e8e8e8', fontSize: '13px' }),
  multiValue: (p) => ({ ...p, background: 'rgba(245,158,11,0.15)', borderRadius: '4px' }),
  multiValueLabel: (p) => ({ ...p, color: '#f59e0b', fontSize: '12px' }),
  multiValueRemove: (p) => ({ ...p, color: '#f59e0b' }),
  input: (p) => ({ ...p, color: '#e8e8e8' }),
  placeholder: (p) => ({ ...p, color: 'rgba(255,255,255,0.2)', fontSize: '13px' }),
};

const inp = 'w-full px-3 py-2.5 bg-white/5 border border-white/10 rounded-md text-sm text-white placeholder-white/20 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500';
const lbl = 'block text-xs text-white/50 mb-1.5';

const UpdateEvent = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [users, setUsers] = useState([]);
  const [form, setForm] = useState({ title: "", description: "", startDate: "", endDate: "", assignedTo: [], slotGap: "" });

  useEffect(() => {
    const load = async () => {
      try {
        const [ur, er] = await Promise.all([Axios.post("/auth/users-list"), Axios.get("/events/" + id)]);
        setUsers(ur.data.users || []);
        const ev = er.data;
        setForm({
          title: ev.title || "",
          description: ev.description || "",
          startDate: ev.startDate ? new Date(ev.startDate).toISOString().slice(0, 16) : "",
          endDate: ev.endDate ? new Date(ev.endDate).toISOString().slice(0, 16) : "",
          assignedTo: ev.assignedTo?.map(u => ({ value: u._id, label: u.username + " (" + u.email + ")" })) || [],
          slotGap: ev.slotGap || "",
        });
      } catch { setError("Failed to load data"); }
      finally { setLoading(false); }
    };
    load();
  }, [id]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (!form.title || form.assignedTo.length === 0) { setError("Title and Assigned To are required."); return; }
    if (form.startDate && form.endDate && new Date(form.endDate) <= new Date(form.startDate)) { setError("End date must be after start date."); return; }
    setSaving(true);
    try {
      await Axios.put("/events/" + id, { ...form, assignedTo: form.assignedTo.map(o => o.value), slotGap: parseInt(form.slotGap) || null });
      navigate("/app");
    } catch (err) { setError(err?.response?.data?.error || "Update failed"); }
    finally { setSaving(false); }
  };

  const userOptions = users.map(u => ({ value: u._id, label: u.username + " (" + u.email + ")" }));
  const slotOpts = [{ value: 15, label: '15 min' }, { value: 20, label: '20 min' }, { value: 30, label: '30 min' }];

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-amber-500" />
    </div>
  );

  return (
    <div className="max-w-2xl mx-auto py-10 px-4">
      <h1 className="text-xl font-bold text-white mb-6">Update Event</h1>
      <form onSubmit={handleSubmit} className="space-y-5 bg-[#1a1a1a] border border-white/10 rounded-xl p-6">
        {error && <p className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded px-3 py-2">{error}</p>}
        <div><label className={lbl}>Title</label><input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} className={inp} required /></div>
        <div><label className={lbl}>Description</label><textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={3} className={inp + ' resize-none'} /></div>
        <div className="flex gap-4">
          <div className="flex-1">
            <label className={lbl}>Start Date</label>
            <input type="datetime-local" value={form.startDate} onChange={e => setForm(f => ({ ...f, startDate: e.target.value, endDate: f.endDate && new Date(f.endDate) <= new Date(e.target.value) ? "" : f.endDate }))} className={inp + ' [color-scheme:dark]'} />
          </div>
          <div className="flex-1">
            <label className={lbl}>End Date</label>
            <input type="datetime-local" value={form.endDate} min={form.startDate || undefined} onChange={e => setForm(f => ({ ...f, endDate: e.target.value }))} className={inp + ' [color-scheme:dark]'} />
          </div>
        </div>
        <div>
          <label className={lbl}>Assign To</label>
          <Select isMulti value={form.assignedTo} onChange={v => setForm(f => ({ ...f, assignedTo: v || [] }))} options={userOptions} styles={darkSelect} placeholder="Select users..." closeMenuOnSelect={false} isSearchable isClearable />
        </div>
        <div>
          <label className={lbl}>Slot Gap</label>
          <select value={form.slotGap} onChange={e => setForm(f => ({ ...f, slotGap: e.target.value }))} className={inp + ' cursor-pointer'}>
            <option value="">Select Slot Gap</option>
            {slotOpts.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </div>
        <button type="submit" disabled={saving} className="w-full bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-black text-sm font-semibold py-2.5 rounded-md transition-colors">
          {saving ? "Updating..." : "Update Event"}
        </button>
      </form>
    </div>
  );
};

export default UpdateEvent;
