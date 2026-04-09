import React, { useContext, useEffect, useState } from "react";
import DataContext from "../Context/DataContext";
import Axios from "../Api/Axios";
import { useParams } from 'react-router-dom';
import { UserContext } from "../Context/UserContext";
import { useToast } from "../Context/ToastContext";

const Meeting = () => {
    const { id } = useParams(); 
    const { fileUserData, setFileUserData, refetch } = useContext(DataContext);
    const [filteredUsers, setFilteredUsers] = useState([]);
    const [loading, setLoading] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [deleteLoading, setDeleteLoading] = useState(false);
    const { user: loggedInUser } = useContext(UserContext);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [slotToDelete, setSlotToDelete] = useState({ userId: null, slotTime: null });
    const [eventData, setEventData] = useState();
    const { toast } = useToast();


    const fetchData = async () => {
        setLoading(true);
        try {
            const userResponse = await Axios.get("/files/get-filedata/"+id);
            if (userResponse.status >= 300) throw new Error("Failed to fetch user data");
            const userData = await userResponse.data;
            const slotsResponse = await Axios.post("/slot/get-all-booked-slots", { event: id });
            if (slotsResponse.status >= 300) throw new Error("Failed to fetch slots");
            const slotsData = await slotsResponse.data;

            const usersWithSlots = userData.users.map((user) => {
                const userSlots = {};
                slotsData.forEach((slot) => {
                    if (slot.userId === user._id) {
                        userSlots[slot.timeSlot] = {
                            company: slot.company,
                            completed: slot.completed,
                        };
                    }
                });
                return { ...user, slots: userSlots };
            });

            const usersWithBookedSlots = usersWithSlots.filter(user => user.slots && Object.keys(user.slots).length > 0);
            setFileUserData(usersWithBookedSlots);
            setFilteredUsers(usersWithBookedSlots);
        } catch (error) {
            console.error("Error fetching data:", error);
            toast("Failed to fetch data", "error");
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteClick = (userId, slotTime) => {
        setSlotToDelete({ userId, slotTime });
        setShowDeleteModal(true);
    };

    const deleteSlot = async () => {
        setDeleteLoading(true);
        try {
            const response = await Axios.delete(`/slot/delete/${slotToDelete.userId}`, { 
                data: { event: id, slotTime: slotToDelete.slotTime } 
            });

            if (response.status >= 200 && response.status < 300) {
                setFileUserData((prevData) =>
                    prevData.map((user) => {
                        if (user._id === slotToDelete.userId) {
                            const updatedSlots = { ...user.slots };
                            delete updatedSlots[slotToDelete.slotTime];
                            return { ...user, slots: updatedSlots };
                        }
                        return user;
                    })
                );
            } else {
                throw new Error(response.data.message || "Failed to delete slot");
            }
        } catch (error) {
            console.error("Error deleting slot:", error);
            toast(error.response?.data?.message || "Error deleting slot", "error");
        } finally {
            setDeleteLoading(false);
            setShowDeleteModal(false);
            setSlotToDelete({ userId: null, slotTime: null });
        }
    };

    useEffect(() => {
        if (id) {
            fetchData(id);
        }
    }, [id]); 
    
    useEffect(() => {
        if (searchQuery.trim() === "") {
            setFilteredUsers(fileUserData);
        } else {
            const filtered = fileUserData.filter(
                (user) =>
                    (user.firstName && user.firstName.toLowerCase().includes(searchQuery.toLowerCase())) ||
                    (user.lastName && user.lastName.toLowerCase().includes(searchQuery.toLowerCase())) ||
                    (user.title && user.title.toLowerCase().includes(searchQuery.toLowerCase())) ||
                    (user.company && user.company.toLowerCase().includes(searchQuery.toLowerCase()))
            );
            setFilteredUsers(filtered);
        }
        if (fileUserData.length > 0 && fileUserData[0].event) {
            setEventData(fileUserData[0].event);
          }
    }, [searchQuery, fileUserData]);

    const generateTimeSlots = () => {
        // Default to 30 minutes if no event data or slotGap is available
        const slotGap = eventData?.slotGap || 30;
        
        // Calculate total minutes from 10:00 to 17:30 (7.5 hours = 450 minutes)
        const startTime = 10 * 60; // 10:00 in minutes (600 minutes from midnight)
        const endTime = 17 * 60 + 30; // 17:30 in minutes (1050 minutes from midnight)
        const totalMinutes = endTime - startTime; // 450 minutes
        
        // Calculate number of slots
        const numberOfSlots = Math.floor(totalMinutes / slotGap);
        
        return Array.from({ length: numberOfSlots }, (_, i) => {
          const totalMinutesFromStart = startTime + (i * slotGap);
          const hour = Math.floor(totalMinutesFromStart / 60);
          const minutes = totalMinutesFromStart % 60;
          
          // Format time as HH:MM
          const formattedHour = hour.toString().padStart(2, '0');
          const formattedMinutes = minutes.toString().padStart(2, '0');
          
          return `${formattedHour}:${formattedMinutes}`;
        }).filter(time => {
          // Only include times up to 17:30
          const [hour, minute] = time.split(':').map(Number);
          return hour < 17 || (hour === 17 && minute <= 30);
        });
      };

    return (
        <div className="p-4 md:p-8 max-w-7xl mx-auto">
            {showDeleteModal && (
                <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
                    <div className="bg-[#1a1a1a] border border-white/10 rounded-lg max-w-md w-full p-6">
                        <h3 className="text-sm font-semibold text-white mb-2">Delete slot?</h3>
                        <p className="text-white/40 text-xs mb-5">This action cannot be undone.</p>
                        <div className="flex justify-end gap-2">
                            <button onClick={() => setShowDeleteModal(false)} disabled={deleteLoading}
                                className="px-4 py-2 text-xs border border-white/10 rounded-md text-white/50 hover:text-white transition-colors disabled:opacity-50">Cancel</button>
                            <button onClick={deleteSlot} disabled={deleteLoading}
                                className="px-4 py-2 text-xs bg-red-500 hover:bg-red-400 text-white rounded-md disabled:opacity-50 transition-colors">
                                {deleteLoading ? "Deleting..." : "Delete"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                <div>
                    <h1 className="text-xl font-bold text-white">Meeting Schedule</h1>
                    <p className="text-white/40 text-sm mt-0.5">Manage all scheduled meetings</p>
                </div>
                <div className="flex gap-3">
                    <div className="relative">
                        <svg className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/30" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                        <input type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Search attendees..."
                            className="pl-9 pr-3 py-2 bg-white/5 border border-white/10 rounded-md text-sm text-white placeholder-white/20 focus:outline-none focus:border-amber-500 w-56" />
                    </div>
                    <button onClick={fetchData} disabled={loading}
                        className="flex items-center gap-2 bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-black text-xs font-semibold px-4 py-2 rounded-md transition-colors">
                        {loading ? "Loading..." : "Refresh"}
                    </button>
                </div>
            </div>

            {filteredUsers?.length === 0 ? (
                <div className="bg-[#1a1a1a] border border-white/10 rounded-xl p-10 text-center">
                    <p className="text-white/30 text-sm">No attendees with booked slots</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {filteredUsers.filter(user => user.slots && Object.keys(user.slots).length > 0).map(user => (
                        <div key={user._id} className="bg-[#1a1a1a] border border-white/10 rounded-xl overflow-hidden">
                            <div className="p-4 border-b border-white/5 flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400 font-bold text-sm flex-shrink-0">
                                    {user.firstName?.charAt(0)}{user.lastName?.charAt(0)}
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-white">{user.firstName} {user.lastName}</p>
                                    <p className="text-xs text-white/40">{user.title} at {user.company}</p>
                                </div>
                            </div>
                            <div className="flex flex-wrap gap-2 p-3">
                                <span className="text-[10px] text-white/30 font-medium self-center">Booked:</span>
                                {Object.entries(user.slots).map(([slotTime, slotInfo]) => (
                                    <div key={slotTime} className="relative">
                                        <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${slotInfo.completed ? 'bg-emerald-500/20 text-emerald-400' : 'bg-blue-500/20 text-blue-400'}`}>
                                            {slotTime} — {slotInfo.company}
                                        </span>
                                        {!slotInfo.completed && loggedInUser?.role !== 'viewer' && (
                                            <button onClick={() => handleDeleteClick(user._id, slotTime)}
                                                className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-red-500 hover:bg-red-400 text-white rounded-full flex items-center justify-center transition-colors">
                                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-2.5 h-2.5">
                                                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                                                </svg>
                                            </button>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default Meeting;