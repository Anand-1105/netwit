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
        setEditForm((prev) => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value,
        }));
    };
console.log(slots);

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
        <div className="border border-gray-200 rounded-xl w-full p-4 md:p-6 mb-6 shadow-sm bg-white transition-all duration-200 hover:shadow-lg group">
            <div className="flex flex-col gap-4 md:gap-6">
                {/* User Info Section */}
                <div className="flex-1">
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                        <div className="flex-1 min-w-0">
                            <h3 className="text-lg md:text-xl font-bold text-gray-800 break-words">
                                {highlightMatch(user.firstName)} {highlightMatch(user.lastName)}
                            </h3>
                            <div className="flex items-start text-gray-600 mt-2">
                                <FiBriefcase className="mr-2 mt-0.5 text-base md:text-lg opacity-70 flex-shrink-0" />
                                <span className="text-sm md:text-base break-words">
                                    {highlightMatch(user.title)} at {highlightMatch(user.company)}
                                </span>
                            </div>
                        </div>
                        {/* Booking Button + Edit & Delete Buttons */}
                        <div className="flex gap-2 items-center">
                            <button
                                onClick={() => setShowBookingForm(!showBookingForm)}
                                className={`flex-shrink-0 px-3 py-2 md:px-4 md:py-2 rounded-full text-xs md:text-sm font-medium transition-all ${
                                    userBookedSlots.length >= timeSlots.length
                                        ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                                        : "bg-blue-50 text-blue-600 hover:bg-blue-100"
                                } flex items-center gap-1 md:gap-2 whitespace-nowrap`}
                                disabled={userBookedSlots.length >= timeSlots.length}
                                title="Book Slot"
                            >
                                <CiCalendar className="text-base md:text-lg flex-shrink-0" />
                                <span className="hidden sm:inline">{showBookingForm ? "Close" : "Book Slot"}</span>
                                <span className="sm:hidden">{showBookingForm ? "Close" : "Book"}</span>
                                {availableSlots > 0 && (
                                    <span className="bg-blue-100 text-blue-800 text-[10px] md:text-xs px-1.5 md:px-2 py-1 rounded-full flex-shrink-0">
                                        {availableSlots} left
                                    </span>
                                )}
                            </button>
                            <button
                                className="p-2 rounded-full hover:bg-blue-50 text-blue-600 border border-transparent hover:border-blue-200"
                                title="Edit User"
                                onClick={() => setShowEditDialog(true)}
                            >
                                <FiEdit2 />
                            </button>
                            <button
                                className="p-2 rounded-full hover:bg-red-50 text-red-600 border border-transparent hover:border-red-200"
                                title="Delete User"
                                onClick={() => setShowDeleteDialog(true)}
                            >
                                <FiTrash2 />
                            </button>
                        </div>
                    </div>

                    <div className="mt-4 space-y-3">
                        <div className="flex items-start text-gray-700">
                            <CiMail className="mr-2 md:mr-3 mt-0.5 text-base md:text-lg opacity-70 flex-shrink-0" />
                            <span className="text-sm md:text-base break-all">{highlightMatch(user.email)}</span>
                        </div>
                        <div className="flex items-start text-gray-700">
                            <CiPhone className="mr-2 md:mr-3 mt-0.5 text-base md:text-lg opacity-70 flex-shrink-0" />
                            <span className="text-sm md:text-base">{highlightMatch(user.phone)}</span>
                        </div>
                        {user.selectedBy?.length > 0 && (
                            <div className="flex items-start text-gray-700">
                                <FiTag className="mr-2 md:mr-3 mt-1 text-base md:text-lg opacity-70 flex-shrink-0" />
                                <div className="min-w-0 flex-1">
                                    <span className="font-medium text-sm md:text-base">Selected by:</span>
                                    <div className="flex flex-wrap gap-1.5 md:gap-2 mt-2">
                                        {user.selectedBy.map((company, index) => (
                                           <>
                                           {company.selected && <span key={index} className="bg-gray-100 px-2 py-1 rounded-full text-xs md:text-sm break-words">
                                                {highlightMatch(company.name)}
                                            </span>}
                                           </>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Booked Slots */}
                    {userBookedSlots.length > 0 && (
                        <div className="mt-6 p-3 md:p-4 border border-gray-100 rounded-lg bg-gray-50">
                            <div className="flex items-center text-gray-800 font-medium">
                                <CiClock2 className="mr-2 text-lg md:text-xl flex-shrink-0" />
                                <span className="text-sm md:text-base">Booked Meetings</span>
                            </div>
                            <ul className="mt-3 space-y-2">
                                {userBookedSlots.map((slot, index) => (
                                    <li key={index} className="flex items-center justify-between bg-white p-2 md:p-3 rounded-lg shadow-xs gap-2">
                                        <div className="flex items-center min-w-0 flex-1">
                                            <span className="w-5 h-5 md:w-6 md:h-6 bg-blue-100 text-blue-800 rounded-full flex items-center justify-center text-[10px] md:text-xs font-medium mr-2 md:mr-3 flex-shrink-0">
                                                {index + 1}
                                            </span>
                                            <span className="font-medium text-sm md:text-base">{slot.timeSlot}</span>
                                        </div>
                                        <span className="bg-green-50 text-green-700 px-2 md:px-3 py-1 rounded-full text-xs md:text-sm flex-shrink-0 max-w-[120px] md:max-w-none truncate">
                                            {slot.company}
                                        </span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}
                </div>

                {/* Booking Form */}
                {showBookingForm && (
                    <div className="w-full border-t md:border-t-0 md:border-l border-gray-100 pt-4 md:pt-0 md:pl-6">
                        <form onSubmit={handleSubmit} className="space-y-4 md:space-y-5">
                            <h4 className="text-base md:text-lg font-bold text-gray-800 flex items-center gap-2">
                                <CiCalendar className="text-lg md:text-xl" />
                                Schedule Meeting
                            </h4>

                            {/* Company Selection */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Select Company
                                </label>    
                                <Select
                                    className="basic-single"
                                    classNamePrefix="select"
                                    options={selectedByOptions.map(company => ({ value: company, label: company }))}
                                    value={selectedByOptions && selectedCompany ? { value: selectedCompany, label: selectedCompany } : null}
                                    onChange={option => handleCompanyChange(option.value)}
                                    isOptionDisabled={(option) => hasUserBookedCompany(option.value)}
                                    isSearchable
                                    placeholder="Search or select company..."
                                    styles={{
                                        menu: provided => ({ ...provided, maxHeight: 180 }),
                                        menuList: provided => ({ ...provided, maxHeight: 180 }),
                                    }}
                                />
                                {hasUserBookedCompany(selectedCompany) && (
                                    <p className="text-xs text-red-600 mt-1">You have already booked a slot with this company.</p>
                                )}
                            </div>

                            {/* Time Slot Selection */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Available Time Slots
                                </label>
                                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-2 lg:grid-cols-3 gap-2">
                                    {timeSlots.map((time) => (
                                        <button
                                            type="button"
                                            key={time}
                                            onClick={() => !isTimeSlotBooked(time) && !isCompanyTimeTaken(time) && !hasUserBookedCompany(selectedCompany) && setSelectedTime(time)}
                                            className={`p-2 md:p-3 rounded-lg text-center transition-all text-sm md:text-base ${
                                                isTimeSlotBooked(time) || isCompanyTimeTaken(time) || hasUserBookedCompany(selectedCompany)
                                                    ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                                                    : selectedTime === time
                                                    ? "bg-blue-600 text-white"
                                                    : "bg-gray-50 hover:bg-gray-100 text-gray-700"
                                            }`}
                                            disabled={isTimeSlotBooked(time) || isCompanyTimeTaken(time) || hasUserBookedCompany(selectedCompany)}
                                        >
                                            {time}
                                            {(isTimeSlotBooked(time) || isCompanyTimeTaken(time) || hasUserBookedCompany(selectedCompany)) && (
                                                <span className="block text-[10px] md:text-xs text-red-500 mt-1">
                                                    {hasUserBookedCompany(selectedCompany)
                                                        ? "Already booked with this company"
                                                        : isTimeSlotBooked(time)
                                                        ? "Time already booked"
                                                        : "This time is taken for this company"}
                                                </span>
                                            )}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Action Buttons */}
                            <div className="flex flex-col sm:flex-row justify-end gap-2 sm:gap-3 pt-4">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowBookingForm(false);
                                        setSelectedCompany("");
                                        setSelectedTime("");
                                    }}
                                    className="w-full sm:w-auto px-4 py-2 text-gray-600 hover:text-gray-800 rounded-lg hover:bg-gray-100 transition-colors text-sm md:text-base"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSubmitting || !selectedCompany || !selectedTime || hasUserBookedCompany(selectedCompany) || isTimeSlotBooked(selectedTime) || loggedInUser.role==="viewer"}
                                    className={`w-full sm:w-auto px-4 py-2 rounded-lg text-white disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2 text-sm md:text-base ${
                                        isSubmitting || !selectedCompany || !selectedTime || hasUserBookedCompany(selectedCompany) || isTimeSlotBooked(selectedTime)
                                            ? "bg-gray-300 cursor-not-allowed"
                                            : "bg-green-500 hover:bg-green-600"
                                    }`}
                                >
                                    {isSubmitting ? (
                                        <>
                                            <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                            </svg>
                                            <span className="hidden sm:inline">Processing...</span>
                                            <span className="sm:hidden">Wait...</span>
                                        </>
                                    ) : (
                                        <>
                                            <FiCheck className="flex-shrink-0" />
                                            <span className="hidden sm:inline">Confirm Booking</span>
                                            <span className="sm:hidden">Confirm</span>
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                )}
            {/* Edit Dialog */}
            {showEditDialog && (
                <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/20">
                    <div className="bg-white rounded-lg shadow-lg max-w-md w-full p-6 relative">
                        <h2 className="text-lg font-bold mb-4">Edit User</h2>
                        <form onSubmit={handleEditSubmit} className="space-y-4">
                            <div className="flex gap-2">
                                <input type="text" name="firstName" value={editForm.firstName} onChange={handleEditChange} placeholder="First Name" className="border rounded px-3 py-2 w-1/2" required />
                                <input type="text" name="lastName" value={editForm.lastName} onChange={handleEditChange} placeholder="Last Name" className="border rounded px-3 py-2 w-1/2" required />
                            </div>
                            <input type="text" name="company" value={editForm.company} onChange={handleEditChange} placeholder="Company" className="border rounded px-3 py-2 w-full" />
                            <input type="text" name="title" value={editForm.title} onChange={handleEditChange} placeholder="Title" className="border rounded px-3 py-2 w-full" />
                            <input type="email" name="email" value={editForm.email} onChange={handleEditChange} placeholder="Email" className="border rounded px-3 py-2 w-full" required />
                            <input type="text" name="phone" value={editForm.phone} onChange={handleEditChange} placeholder="Phone" className="border rounded px-3 py-2 w-full" />
                            {/* <div className="flex gap-2 items-center">
                                <label className="text-sm font-medium">Gift Collected</label>
                                <input type="checkbox" name="giftCollected" checked={editForm.giftCollected} onChange={handleEditChange} />
                            </div> */}
                            <div>
                                <label className="text-sm font-medium">Status</label>
                                <select name="status" value={editForm.status} onChange={handleEditChange} className="border rounded px-3 py-2 w-full">
                                    <option value="pending">Pending</option>
                                    <option value="completed">Completed</option>
                                    <option value="not-available">Not Available</option>
                                    <option value="removed">Removed</option>
                                </select>
                            </div>
                            <div className="flex gap-2 justify-end mt-4">
                                <button type="button" className="px-4 py-2 rounded bg-gray-100 hover:bg-gray-200 text-gray-700" onClick={() => setShowEditDialog(false)} disabled={editLoading}>Cancel</button>
                                <button type="submit" className="px-4 py-2 rounded bg-blue-600 hover:bg-blue-700 text-white" disabled={editLoading}>{editLoading ? 'Saving...' : 'Save'}</button>
                            </div>
                        </form>
                        <button className="absolute top-2 right-2 text-gray-400 hover:text-gray-700" onClick={() => setShowEditDialog(false)}>&times;</button>
                    </div>
                </div>
            )}
            {/* Delete Confirmation Dialog */}
            {showDeleteDialog && (
                <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/20">
                    <div className="bg-white rounded-lg shadow-lg max-w-md w-full p-6 relative">
                        <h2 className="text-lg font-bold mb-4 text-red-600">Delete User</h2>
                        <p className="mb-6">Are you sure you want to delete <b>{user.firstName} {user.lastName}</b>? This action cannot be undone.</p>
                        <div className="flex gap-2 justify-end">
                            <button className="px-4 py-2 rounded bg-gray-100 hover:bg-gray-200 text-gray-700" onClick={() => setShowDeleteDialog(false)} disabled={deleteLoading}>Cancel</button>
                            <button className="px-4 py-2 rounded bg-red-600 hover:bg-red-700 text-white" onClick={handleDelete} disabled={deleteLoading}>{deleteLoading ? 'Deleting...' : 'Delete'}</button>
                        </div>
                        <button className="absolute top-2 right-2 text-gray-400 hover:text-gray-700" onClick={() => setShowDeleteDialog(false)}>&times;</button>
                    </div>
                </div>
            )}
        </div>
        </div>
    );
};
export default UserCard;