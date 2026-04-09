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
            {/* Delete Confirmation Modal */}
            {showDeleteModal && (
                <div className="fixed inset-0 bg-black/50  flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
                        <h3 className="text-lg font-medium text-gray-900 mb-4">Confirm Deletion</h3>
                        <p className="text-gray-600 mb-6">Are you sure you want to delete this meeting slot? This action cannot be undone.</p>
                        <div className="flex justify-end space-x-3">
                            <button
                                onClick={() => setShowDeleteModal(false)}
                                disabled={deleteLoading}
                                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={deleteSlot}
                                disabled={deleteLoading}
                                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50"
                            >
                                {deleteLoading ? (
                                    <>
                                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white inline" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                        Deleting...
                                    </>
                                ) : "Delete"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Rest of the component remains the same */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Meeting Schedule</h1>
                    <p className="text-gray-600 mt-1">Manage all scheduled meetings</p>
                </div>
                
                <div className="flex flex-col md:flex-row gap-3 w-full md:w-auto">
                    <div className="relative w-full md:w-64">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                        </div>
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Search attendees..."
                            className="pl-10 w-full p-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                    </div>
                    <button
                        onClick={fetchData}
                        disabled={loading}
                        className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {loading ? (
                            <>
                                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                Loading...
                            </>
                        ) : (
                            <>
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                </svg>
                                Refresh
                            </>
                        )}
                    </button>
                </div>
            </div>

            {filteredUsers?.length === 0 ? (
                <div className="bg-white rounded-xl shadow-sm p-8 text-center">
                    <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <h3 className="mt-2 text-lg font-medium text-gray-900">No attendees found</h3>
                    <p className="mt-1 text-gray-500">Try adjusting your search or refresh the data</p>
                </div>
            ) : (
                <div className="space-y-6">
                   {filteredUsers
    .filter(user => user.slots && Object.keys(user.slots).length > 0)
    .map((user) => (
        <div key={user._id} className="bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="p-6 border-b border-gray-200">
                <div className="flex items-center space-x-4">
                    <div className="flex-shrink-0 h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-medium">
                        {user.firstName?.charAt(0)}{user.lastName?.charAt(0)}
                    </div>
                    <div>
                        <h3 className="text-lg font-medium text-gray-900">
                            {user.firstName} {user.lastName}
                        </h3>
                        <p className="text-sm text-gray-500">
                            {user.title} at {user.company}
                        </p>
                    </div>
                </div>
            </div>
            
            {/* Show only booked slots with time and company name as badges, not the full slot grid */}
            {user.slots && Object.keys(user.slots).length > 0 && (
                <div className="mt-2 flex items-center flex-wrap gap-2 p-2">
                    <span className="font-medium text-xs text-gray-600">Booked Slots:</span>
                    {Object.entries(user.slots).map(([slotTime, slotInfo]) => (
                        <div key={slotTime} className="relative">
                            <span className={`  bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs font-semibold ${slotInfo.completed && "bg-green-100 text-green-800"}`}>
                                {slotTime} - {slotInfo.company}
                            </span>
                            {!slotInfo.completed && loggedInUser?.role !== 'viewer' && (
                                <button
                                    onClick={() => handleDeleteClick(user._id, slotTime)}
                                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 focus:outline-none"
                                    style={{ width: '20px', height: '20px' }}
                                >
                                    <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        viewBox="0 0 20 20"
                                        fill="currentColor"
                                        className="w-3 h-3 mx-auto"
                                    >
                                        <path
                                            fillRule="evenodd"
                                            d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                                            clipRule="evenodd"
                                        />
                                    </svg>
                                </button>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    ))}
                </div>
            )}
        </div>
    );
};

export default Meeting;