import React, { useEffect, useState, useContext } from "react";
import Select from "react-select";
import Axios from "../Api/Axios";
import { useNavigate } from "react-router-dom";
import { FiX, FiPlus } from "react-icons/fi";
import SignUp2 from "./Signup2";
import { UserContext } from "../Context/UserContext";

const CreateEvent = () => {
    const [title, setTitle] = useState("");
    const [imageFile, setImageFile] = useState(null); // Changed to handle file upload
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
    const currentUserId = user?._id;

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = () => {
        Axios.post("/auth/users-list")
            .then(res => {
                setUsers(res.data.users || []);
            })
            .catch((err) => {
                console.error("Users List Error:", err);
                setUsers([]);
            });
    };

    // Handle image file selection
    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setImageFile(file);
            // Create preview URL
            const reader = new FileReader();
            reader.onloadend = () => {
                setImagePreview(reader.result);
            };
            reader.readAsDataURL(file);
        }
    };

    // Transform users data for react-select
    const userOptions = users.map(user => ({
        value: user._id,
        label: `${user.username} (${user.email}), Role: ${user?.role}`
    }));

    const slotGapOptions = [
        { value: 15, label: '15 min' },
        { value: 20, label: '20 min' },
        { value: 30, label: '30 min' }
    ];

    const handleAssignedToChange = (selectedOptions) => {
        setAssignedTo(selectedOptions || []);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");
        setLoading(true);

        if (!title || assignedTo.length === 0 || !currentUserId) {
            setError("Title, Assigned To, and Created By are required.");
            setLoading(false);
            return;
        }

        if (startDate && endDate && new Date(endDate) <= new Date(startDate)) {
            setError("End date must be after start date.");
            setLoading(false);
            return;
        }

        try {
            const formData = new FormData();
            formData.append("title", title);
            if (imageFile) {
                formData.append("image", imageFile);
            }
            formData.append("description", description);
            formData.append("startDate", startDate);
            formData.append("endDate", endDate);
            formData.append("slotGap", slotGap);
            formData.append("createdBy", currentUserId);
            
            // Append each assigned user
            assignedTo.forEach(user => {
                formData.append("assignedTo", user.value);
            });

            await Axios.post("/events", formData, {
                headers: {
                    "Content-Type": "multipart/form-data"
                }
            });
            navigate("/app");
        } catch (err) {
            setError(err?.response?.data?.error || "Something went wrong");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-2xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
            <h2 className="text-3xl font-bold mb-8">Create Event</h2>
            <form onSubmit={handleSubmit} className="space-y-6 bg-white p-8 rounded-xl shadow">
                {error && <div className="text-red-500">{error}</div>}
                
                <div>
                    <label className="block font-medium mb-1">Title</label>
                    <input
                        type="text"
                        className="w-full border rounded px-3 py-2"
                        value={title}
                        onChange={e => setTitle(e.target.value)}
                        required
                    />
                </div>
                
                <div>
                    <label className="block font-medium mb-1">Event Image</label>
                    <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageChange}
                        className="w-full border rounded px-3 py-2"
                    />
                    {imagePreview && (
                        <div className="mt-2">
                            <img 
                                src={imagePreview} 
                                alt="Preview" 
                                className="h-40 object-cover rounded"
                            />
                        </div>
                    )}
                </div>
                
                <div>
                    <label className="block font-medium mb-1">Description</label>
                    <textarea
                        className="w-full border rounded px-3 py-2"
                        value={description}
                        onChange={e => setDescription(e.target.value)}
                    />
                </div>
                
                <div className="flex gap-4">
                    <div className="flex-1">
                        <label className="block font-medium mb-1">Start Date</label>
                        <input
                            type="datetime-local"
                            className="w-full border rounded px-3 py-2"
                            value={startDate}
                            onChange={e => { setStartDate(e.target.value); if (endDate && new Date(endDate) <= new Date(e.target.value)) setEndDate(""); }}
                        />
                    </div>
                    <div className="flex-1">
                        <label className="block font-medium mb-1">End Date</label>
                        <input
                            type="datetime-local"
                            className="w-full border rounded px-3 py-2"
                            value={endDate}
                            min={startDate || undefined}
                            onChange={e => setEndDate(e.target.value)}
                        />
                    </div>
                </div>
                
                <div>
                    <div className="flex justify-between items-center mb-1">
                        <label className="block font-medium">Assign To</label>
                        <button
                            type="button"
                            onClick={() => setShowSignupModal(true)}
                            className="text-sm text-blue-600 hover:text-blue-800 flex items-center"
                        >
                            <FiPlus className="mr-1" /> Add User
                        </button>
                    </div>
                    <Select
                        isMulti
                        value={assignedTo}
                        onChange={handleAssignedToChange}
                        options={userOptions}
                        placeholder="Select users..."
                        noOptionsMessage={() => "No users found"}
                        closeMenuOnSelect={false}
                        isSearchable={true}
                        isClearable={true}
                        className="react-select-container"
                        classNamePrefix="react-select"
                    />
                </div>
                
                <div>
                    <label className="block font-medium mb-1">Slot Gap</label>
                    <select
                        className="w-full border rounded px-3 py-2"
                        value={slotGap}
                        onChange={e => setSlotGap(e.target.value)}
                        required
                    >
                        <option value="">Select Slot Gap</option>
                        {slotGapOptions.map(option => (
                            <option key={option.value} value={option.value}>
                                {option.label}
                            </option>
                        ))}
                    </select>
                </div>
                
                <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-blue-600 text-white py-2 rounded font-semibold hover:bg-blue-700 transition disabled:opacity-70"
                >
                    {loading ? "Creating..." : "Create Event"}
                </button>
            </form>

            {/* Add User Modal */}
            {showSignupModal && (
                <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-xl overflow-clip w-full max-w-md relative max-h-[90vh] overflow-y-auto">
                        <button 
                            onClick={() => setShowSignupModal(false)}
                            className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"
                        >
                            <FiX size={24} />
                        </button>
                        
                        <SignUp2 
                            onSuccess={() => {
                                setShowSignupModal(false);
                                fetchUsers(); // Refresh the users list
                            }} 
                        />
                    </div>
                </div>
            )}
        </div>
    );
};

export default CreateEvent;