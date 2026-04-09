import React, { useState, useEffect, useContext } from "react";
import Axios from "../Api/Axios";
import { FiEdit2, FiTrash2 } from "react-icons/fi";
import { CiClock2, CiCalendar, CiUser, CiMail, CiPhone } from "react-icons/ci";
import { FiBriefcase, FiTag, FiX, FiCheck } from "react-icons/fi";
import SlotsContext from "../Context/SlotsContext.jsx";
import { UserContext } from "../Context/UserContext.jsx";
import { useToast } from "../Context/ToastContext.jsx";
import Select from "react-select";

const UserCard = ({eventId, user: initialUser, searchQuery, selectedByOptions, timeSlots = [], onUserUpdated, onUserDeleted }) => {
    const [user, setUser] = useState(initialUser);
    const [showBookingForm, setShowBookingForm] = useState(false);
    const [selectedCompany, setSelectedCompany] = useState("");
    const [selectedTime, setSelectedTime] = useState("");
    const { slots, fetchSlots } = useContext(SlotsContext);
    const { toast } = useToast();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const {user:loggedInUser}=useContext(UserContext)

    // Edit & Delete Dialog State
    const [showEditDialog, setShowEditDialog] = useState(false);
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);
    const [editForm, setEditForm] = useState({
        firstName: initialUser.firstName || '',
        lastName: initialUser.lastName || '',
        company: initialUser.company || '',
        title: initialUser.title || '',
        email: initialUser.email || '',
        phone: initialUser.phone || '',
        status: initialUser.status || 'pending',
    });
    const [editLoading, setEditLoading] = useState(false);
    const [deleteLoading, setDeleteLoading] = useState(false);

    useEffect(() => {
        setEditForm({
            firstName: initialUser.firstName || '',
            lastName: initialUser.lastName || '',
            company: initialUser.company || '',
            title: initialUser.title || '',
            email: initialUser.email || '',
            phone: initialUser.phone || '',
            status: initialUser.status || 'pending',
        });
    }, [initialUser]);

    const handleEditChange = (e) => {
        const { name, value, type, checked } = e.target;
        setEditForm(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
    };

    const handleEditSubmit = async (e) => {
        e.preventDefault();
        setEditLoading(true);
        try {
            const response = await Axios.put(`/files/user/${user._id}`, editForm);
            setShowEditDialog(false);
            if (onUserUpdated) onUserUpdated();
            setUser({ ...user, ...editForm });
        } catch (err) {
            toast(err.response?.data?.error || 'Failed to update user.', 'error');
        } finally {
            setEditLoading(false);
        }
    };

    const handleDelete = async () => {
        setDeleteLoading(true);
        try {
            await Axios.delete(`/files/user/${user._id}`);
            setShowDeleteDialog(false);
            if (onUserDeleted) onUserDeleted();
        } catch (err) {
            toast(err.response?.data?.error || 'Failed to delete user.', 'error');
        } finally {
            setDeleteLoading(false);
        }
    };

    useEffect(() => {
        setUser(initialUser);
    }, [initialUser]);

    // Highlight matching text in search results — escape input to prevent regex crash
    const highlightMatch = (text) => {
        if (!searchQuery || !text) return text;
        const escaped = searchQuery.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const regex = new RegExp(`(${escaped})`, "gi");
        return text.toString().split(regex).map((part, i) =>
            i % 2 === 1 ? (
                <mark key={i} className="bg-yellow-100 text-yellow-800 px-1 rounded">{part}</mark>
            ) : (
                part
            )
        );
    };

    const handleCompanyChange = (company) => {
        setSelectedCompany(company);
        // Reset time selection when company changes to avoid stale selection conflicts
        setSelectedTime("");
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);

        if (!selectedTime || !selectedCompany) {
            toast("Please select a company and a time slot.", "warning");
            setIsSubmitting(false);
            return;
        }

        if (hasUserBookedCompany(selectedCompany)) {
            toast("Already booked a slot with this company.", "warning");
            setIsSubmitting(false);
            return;
        }

        if (isTimeSlotBooked(selectedTime)) {
            toast("This time slot is already booked.", "warning");
            setIsSubmitting(false);
            return;
        }

        if (isCompanyTimeTaken(selectedTime)) {
            toast("This time is already taken for the selected company.", "warning");
            setIsSubmitting(false);
            return;
        }

        try {
            const data = {
                userId: user._id,
                timeSlot: selectedTime,
                company: selectedCompany,
                event:eventId
            };

            const response = await Axios.post(`/booking-slot`, data, {
                headers: { "Content-Type": "application/json" }
            });
            await fetchSlots(eventId);
            toast(response.data.message || "Slot booked successfully", "success");
            setShowBookingForm(false);
        } catch (error) {
            console.error("Error booking slot:", error);
            toast(error.response?.data?.error || "An error occurred while booking.", "error");
        } finally {
            setIsSubmitting(false);
        }
    };

    useEffect(() => {
        setUser(initialUser);
    }, [initialUser]);
    const userBookedSlots = slots.filter(slot => slot.userId === user._id && slot.event === eventId);

    // Check if the current user has already booked this time (for this event), regardless of company
   const isTimeSlotBooked = (time) => {
        return userBookedSlots.some(slot => slot.timeSlot === time);
    };

    // Check if any user has booked the same time for the selected company in this event
    const isCompanyTimeTaken = (time) => {
        if (!selectedCompany) return false;
        return slots.some(slot =>
            slot.timeSlot === time &&
            slot.company === selectedCompany &&
            slot.event === eventId
        );
    };

    // Check if the current user has already booked any slot with the selected company for this event
    const hasUserBookedCompany = (company) => {
        if (!company) return false;
        return userBookedSlots.some(slot => slot.company === company);
    };


    // Calculate available slots
    const availableSlots = timeSlots.length - userBookedSlots.length;

    return (
        <div className="border border-white/10 rounded-xl w-full p-4 bg-[#1a1a1a] transition-colors hover:border-white/20 group">
            <div className="flex flex-col gap-4">
                <div className="flex-1">
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                        <div className="flex-1 min-w-0">
                            <h3 className="text-base font-bold text-white/90 break-words">
                                {highlightMatch(user.firstName)} {highlightMatch(user.lastName)}
                            </h3>
                            <div className="flex items-start text-white/40 mt-1.5">
                                <FiBriefcase className="mr-2 mt-0.5 text-sm flex-shrink-0" />
                                <span className="text-sm break-words">{highlightMatch(user.title)} at {highlightMatch(user.company)}</span>
                            </div>
                        </div>
                        <div className="flex gap-1.5 items-center flex-shrink-0">
                            <button onClick={() => setShowBookingForm(!showBookingForm)}
                                disabled={userBookedSlots.length >= timeSlots.length}
                                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${userBookedSlots.length >= timeSlots.length ? 'bg-white/5 text-white/20 cursor-not-allowed' : 'bg-amber-500/20 text-amber-400 hover:bg-amber-500/30'}`}>
                                <CiCalendar size={14} />
                                {showBookingForm ? "Close" : "Book Slot"}
                                {availableSlots > 0 && <span className="bg-amber-500/30 text-amber-300 text-[10px] px-1.5 py-0.5 rounded">{availableSlots} left</span>}
                            </button>
                            <button onClick={() => setShowEditDialog(true)} className="p-1.5 text-white/20 hover:text-white/70 hover:bg-white/5 rounded transition-colors"><FiEdit2 size={13} /></button>
                            <button onClick={() => setShowDeleteDialog(true)} className="p-1.5 text-white/20 hover:text-red-400 hover:bg-red-500/10 rounded transition-colors"><FiTrash2 size={13} /></button>
                        </div>
                    </div>

                    <div className="mt-3 space-y-1.5">
                        <div className="flex items-center text-white/40 text-xs"><CiMail className="mr-2 flex-shrink-0" />{highlightMatch(user.email)}</div>
                        <div className="flex items-center text-white/40 text-xs"><CiPhone className="mr-2 flex-shrink-0" />{highlightMatch(user.phone)}</div>
                        {user.selectedBy?.some(c => c.selected) && (
                            <div className="flex items-start text-white/40 text-xs">
                                <FiTag className="mr-2 mt-0.5 flex-shrink-0" />
                                <div className="flex flex-wrap gap-1">
                                    {user.selectedBy.filter(c => c.selected).map((company, i) => (
                                        <span key={i} className="bg-white/5 border border-white/10 px-2 py-0.5 rounded text-white/50">{highlightMatch(company.name)}</span>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    {userBookedSlots.length > 0 && (
                        <div className="mt-4 p-3 border border-white/5 rounded-lg bg-white/5">
                            <div className="flex items-center text-white/50 text-xs font-medium mb-2"><CiClock2 className="mr-2" />Booked Meetings</div>
                            <ul className="space-y-1.5">
                                {userBookedSlots.map((slot, i) => (
                                    <li key={i} className="flex items-center justify-between bg-[#0f0f0f] px-3 py-2 rounded-md gap-2">
                                        <div className="flex items-center gap-2">
                                            <span className="w-5 h-5 bg-amber-500/20 text-amber-400 rounded-full flex items-center justify-center text-[10px] font-bold">{i + 1}</span>
                                            <span className="text-xs text-white/70">{slot.timeSlot}</span>
                                        </div>
                                        <span className="text-xs text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded truncate max-w-[120px]">{slot.company}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}
                </div>

                {showBookingForm && (
                    <div className="border-t border-white/5 pt-4">
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <h4 className="text-sm font-semibold text-white/70 flex items-center gap-2"><CiCalendar />Schedule Meeting</h4>
                            <div>
                                <label className="block text-xs text-white/40 mb-1.5">Select Company</label>
                                <Select
                                    options={selectedByOptions.map(c => ({ value: c, label: c }))}
                                    value={selectedCompany ? { value: selectedCompany, label: selectedCompany } : null}
                                    onChange={opt => handleCompanyChange(opt.value)}
                                    isOptionDisabled={opt => hasUserBookedCompany(opt.value)}
                                    isSearchable placeholder="Search company..."
                                    styles={{
                                        control: (p, s) => ({ ...p, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '6px', boxShadow: 'none', borderColor: s.isFocused ? '#f59e0b' : 'rgba(255,255,255,0.1)' }),
                                        menu: (p) => ({ ...p, background: '#1a1a1a', border: '1px solid rgba(255,255,255,0.1)' }),
                                        option: (p, s) => ({ ...p, background: s.isFocused ? 'rgba(255,255,255,0.05)' : 'transparent', color: '#e8e8e8', fontSize: '13px' }),
                                        singleValue: (p) => ({ ...p, color: '#e8e8e8' }),
                                        input: (p) => ({ ...p, color: '#e8e8e8' }),
                                        placeholder: (p) => ({ ...p, color: 'rgba(255,255,255,0.2)', fontSize: '13px' }),
                                        menuList: (p) => ({ ...p, maxHeight: 180 }),
                                    }}
                                />
                            </div>
                            <div>
                                <label className="block text-xs text-white/40 mb-1.5">Available Time Slots</label>
                                <div className="grid grid-cols-3 sm:grid-cols-4 gap-1.5">
                                    {timeSlots.map(time => {
                                        const booked = isTimeSlotBooked(time) || isCompanyTimeTaken(time) || hasUserBookedCompany(selectedCompany);
                                        const selected = selectedTime === time;
                                        return (
                                            <button type="button" key={time} onClick={() => !booked && setSelectedTime(time)} disabled={booked}
                                                className={`py-2 rounded-md text-xs text-center transition-colors ${booked ? 'bg-white/5 text-white/20 cursor-not-allowed' : selected ? 'bg-amber-500 text-black font-semibold' : 'bg-white/5 hover:bg-white/10 text-white/60'}`}>
                                                {time}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                            <div className="flex justify-end gap-2 pt-2">
                                <button type="button" onClick={() => { setShowBookingForm(false); setSelectedCompany(""); setSelectedTime(""); }}
                                    className="px-4 py-2 text-xs border border-white/10 rounded-md text-white/40 hover:text-white transition-colors">Cancel</button>
                                <button type="submit" disabled={isSubmitting || !selectedCompany || !selectedTime || hasUserBookedCompany(selectedCompany) || isTimeSlotBooked(selectedTime) || loggedInUser.role === "viewer"}
                                    className="px-4 py-2 text-xs bg-amber-500 hover:bg-amber-400 disabled:opacity-40 disabled:cursor-not-allowed text-black font-semibold rounded-md transition-colors flex items-center gap-1.5">
                                    <FiCheck size={12} />{isSubmitting ? "Booking..." : "Confirm"}
                                </button>
                            </div>
                        </form>
                    </div>
                )}

                {showEditDialog && (
                    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/70">
                        <div className="bg-[#1a1a1a] border border-white/10 rounded-xl max-w-md w-full p-6 relative">
                            <h2 className="text-sm font-bold text-white mb-4">Edit Attendee</h2>
                            <form onSubmit={handleEditSubmit} className="space-y-3">
                                <div className="flex gap-2">
                                    {['firstName','lastName'].map(f => <input key={f} type="text" name={f} value={editForm[f]} onChange={handleEditChange} placeholder={f === 'firstName' ? 'First Name' : 'Last Name'} className="w-1/2 px-3 py-2 bg-white/5 border border-white/10 rounded-md text-sm text-white placeholder-white/20 focus:outline-none focus:border-amber-500" required />)}
                                </div>
                                {['company','title','email','phone'].map(f => <input key={f} type={f === 'email' ? 'email' : 'text'} name={f} value={editForm[f]} onChange={handleEditChange} placeholder={f.charAt(0).toUpperCase() + f.slice(1)} className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-md text-sm text-white placeholder-white/20 focus:outline-none focus:border-amber-500" />)}
                                <select name="status" value={editForm.status} onChange={handleEditChange} className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-md text-sm text-white focus:outline-none focus:border-amber-500 cursor-pointer">
                                    {['pending','completed','not-available','removed'].map(s => <option key={s} value={s}>{s}</option>)}
                                </select>
                                <div className="flex gap-2 justify-end pt-2">
                                    <button type="button" onClick={() => setShowEditDialog(false)} disabled={editLoading} className="px-4 py-2 text-xs border border-white/10 rounded-md text-white/40 hover:text-white transition-colors">Cancel</button>
                                    <button type="submit" disabled={editLoading} className="px-4 py-2 text-xs bg-amber-500 hover:bg-amber-400 text-black font-semibold rounded-md disabled:opacity-50 transition-colors">{editLoading ? 'Saving...' : 'Save'}</button>
                                </div>
                            </form>
                            <button className="absolute top-4 right-4 text-white/30 hover:text-white" onClick={() => setShowEditDialog(false)}><FiX size={16} /></button>
                        </div>
                    </div>
                )}

                {showDeleteDialog && (
                    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/70">
                        <div className="bg-[#1a1a1a] border border-white/10 rounded-xl max-w-md w-full p-6 relative">
                            <h2 className="text-sm font-bold text-white mb-2">Delete attendee?</h2>
                            <p className="text-white/40 text-xs mb-5">This will permanently remove <span className="text-white/70 font-medium">{user.firstName} {user.lastName}</span>.</p>
                            <div className="flex gap-2 justify-end">
                                <button onClick={() => setShowDeleteDialog(false)} disabled={deleteLoading} className="px-4 py-2 text-xs border border-white/10 rounded-md text-white/40 hover:text-white transition-colors">Cancel</button>
                                <button onClick={handleDelete} disabled={deleteLoading} className="px-4 py-2 text-xs bg-red-500 hover:bg-red-400 text-white rounded-md disabled:opacity-50 transition-colors">{deleteLoading ? 'Deleting...' : 'Delete'}</button>
                            </div>
                            <button className="absolute top-4 right-4 text-white/30 hover:text-white" onClick={() => setShowDeleteDialog(false)}><FiX size={16} /></button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default UserCard;
