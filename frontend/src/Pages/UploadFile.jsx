import React, { useState, useEffect, useContext } from "react";
import UserCard from "../Components/UserCard";
import DataContext from "../Context/DataContext";
import Axios from "../Api/Axios";
import { FiUpload, FiSearch, FiUsers, FiClock, FiTrash2, FiX, FiCheck, FiPlus, FiDownload } from "react-icons/fi";
import { useParams } from 'react-router-dom';
import SignUp2 from "./Signup2";
import { UserContext } from "../Context/UserContext";
import DownloadReport from "../Components/DownloadReport";
import { useToast } from "../Context/ToastContext";

const FileUpload = () => {
  const { id } = useParams();  
  const [file, setFile] = useState(null);
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [eventData, setEventData] = useState();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const { fileUserData, isLoading, refetch } = useContext(DataContext);
  const [showSignupModal, setShowSignupModal] = useState(false);
  const { user } = useContext(UserContext);
  const { toast } = useToast();
  const handleFileChange = (e) => {
    if (e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!file) {
      toast("Please select a file first", "warning");
      return;
    }
  
    const formData = new FormData();
    formData.append("file", file); 
    setLoading(true);
  
    try {
      await Axios.post(`/files/upload-file/${id}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      setFile(null);
      refetch(id);
    } catch (error) {
      console.error("Upload error:", error);
      toast(error.response?.data?.error || "File upload failed", "error");
    } finally {
      setLoading(false);
    }
  };

  const deleteData = async () => {
    try {
      await Axios.delete(`/files/delete-filedata/${id}`);
      refetch(id);
      setShowDeleteConfirm(false);
    } catch (error) {
      console.error("Delete error:", error);
      toast("Failed to delete data", "error");
    }
  };

  useEffect(() => {
    if (id) refetch(id);
  }, [id]);

  useEffect(() => {
    if (fileUserData && Array.isArray(fileUserData)) {
      setData(fileUserData);
      // Extract event data from the first user if available
      if (fileUserData.length > 0 && fileUserData[0].event) {
        setEventData(fileUserData[0].event);
      }
    }
  }, [fileUserData]);

  // Filter and sort data
  const filteredData = (data || [])
    .filter(user => {
      const searchLower = searchQuery.toLowerCase();
      return (
        user.firstName?.toLowerCase().includes(searchLower) ||
        user.lastName?.toLowerCase().includes(searchLower) ||
        `${user.firstName} ${user.lastName}`.toLowerCase().includes(searchLower)
      );
    })
    .sort((a, b) => (b.selectedBy?.length || 0) - (a.selectedBy?.length || 0));

  // Generate time slots dynamically based on slotGap from event data
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

  // Get unique companies from all users
  const getSelectedByOptions = () => {
    const companies = new Set();
    data.forEach(user => {
      user.selectedBy?.forEach(companyObj => {
        if (companyObj && companyObj.name) {
          companies.add(companyObj.name);
        }
      });
    });
    return Array.from(companies);
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
              Conference Room Booking System 
            </h1>
            <p className="text-gray-600 mt-2">
              Manage attendee schedules and meeting slots
              {eventData?.slotGap && (
                <span className="ml-2 text-sm bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                  {eventData.slotGap} min slots
                </span>
              )}
            </p>
          </div>
          <div className="flex items-center flex-wrap gap-4">
          <DownloadReport id={id}/>
            <div className="flex items-center gap-3 bg-white px-4 py-2 rounded-full shadow-sm border border-gray-200">
              <div className="bg-blue-100 p-2 rounded-full">
                <FiUsers className="text-blue-600" />
              </div>
              <span className="font-medium text-gray-700">
                {data.length} {data.length === 1 ? 'Attendee' : 'Attendees'}
              </span>
            </div>
            
            <button 
              disabled={user.role==="viewer"}
              onClick={() => setShowSignupModal(true)}
              className="flex items-center gap-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-500 disabled:cursor-not-allowed text-white px-4 py-2 rounded-full shadow-sm transition-colors"
            >
              <FiPlus />
              Assign User
            </button>
          </div>
        </div>

        {showSignupModal && (
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-xl overflow-clip w-full max-w-md relative max-h-[90vh] overflow-y-auto">
              <button 
                onClick={() => setShowSignupModal(false)}
                className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"
              >
                <FiX size={24} />
              </button>
              
              {/* Pass eventId to SignUp component */}
              <SignUp2 
                eventId={id} 
                onSuccess={() => {
                  setShowSignupModal(false);
                  refetch(id); 
                }} 
              />
            </div>
          </div>
        )}

        {/* File Upload Card */}
        {user.role!=="viewer"&&<div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden mb-8">
          <div className="p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Upload Attendee List</h2>
            
           <div className="flex flex-col md:flex-row gap-4 items-center">
              <label className="flex-1 w-full cursor-pointer group">
                <div className={`flex items-center gap-4 p-4 border-2 border-dashed rounded-lg transition-all 
                  ${file ? 'border-blue-400 bg-blue-50' : 'border-gray-300 group-hover:border-blue-400'}`}>
                  <div className={`p-3 rounded-full transition-colors 
                    ${file ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-500 group-hover:bg-blue-100 group-hover:text-blue-600'}`}>
                    <FiUpload size={20} />
                  </div>
                  <div className="flex-1 min-w-0">
                    {file ? (
                      <p className="font-medium text-gray-900 truncate">{file.name}</p>
                    ) : (
                      <p className="text-gray-700">
                        <span className="text-blue-600 font-medium">Browse files</span> or drag and drop
                      </p>
                    )}
                    <p className="text-sm text-gray-500 mt-1">Excel files (.xlsx, .xls)</p>
                  </div>
                </div>
                <input 
                  type="file" 
                  onChange={handleFileChange} 
                  className="hidden" 
                  accept=".xlsx,.xls" 
                />
              </label>
              <button
                type="button"
                className="flex items-center gap-2 bg-gray-200 hover:bg-gray-300 text-gray-700 px-6 py-3 rounded-lg shadow-sm border border-gray-300 transition-colors"
                onClick={() => window.open('/format.xlsx', '_blank')}
              >
                <FiDownload className="mr-1" />
                Format
              </button>
              <button
                onClick={handleUpload}
                disabled={loading || !file}
                className={`flex items-center justify-center gap-2 px-6 py-3 rounded-lg transition-all min-w-[150px]
                  ${loading ? 'bg-blue-400 cursor-wait' : 
                    !file ? 'bg-gray-200 text-gray-500 cursor-not-allowed' : 
                    'bg-blue-600 hover:bg-blue-700 text-white shadow-md'}`}
              >
                {loading ? (
                  <>
                    <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Uploading...
                  </>
                ) : (
                  <>
                    <FiUpload size={18} />
                    Upload
                  </>
                )}
              </button>
            </div>
          </div>
        </div>}

        {/* Search and Actions Bar */}
        <div className="mb-6 flex flex-col sm:flex-row gap-4 items-start sm:items-center">
          <div className="relative flex-1 w-full">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <FiSearch className="text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Search attendees..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="block w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-sm transition-all"
            />
          </div>
          
          <div className="flex gap-3 w-full sm:w-auto">
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="flex items-center gap-2 px-4 py-3 bg-gray-100 hover:bg-gray-200 rounded-xl text-gray-700 transition-colors"
              >
                <FiX size={16} />
                Clear
              </button>
            )}
            
            <button 
             disabled={user.role==="viewer"}
              onClick={() => setShowDeleteConfirm(true)}
              className="flex items-center gap-2 px-4 py-3 bg-red-50 hover:bg-red-100 rounded-xl disabled:opacity-40 disabled:cursor-not-allowed text-red-600 transition-colors"
            >
              <FiTrash2 size={16} />
              Delete All
            </button>
          </div>
        </div>

        {/* Status Info */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2 text-gray-600">
            <FiClock className="text-blue-500" />
            <span className="text-sm">
              Showing {filteredData.length} of {data.length} attendees
            </span>
          </div>
        </div>

        {/* Data Display */}
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-12 bg-white rounded-xl shadow-sm border border-gray-200">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mb-4"></div>
            <p className="text-gray-600">Loading attendee data...</p>
          </div>
        ) : filteredData.length === 0 ? (
          <div className="text-center p-12 bg-white rounded-xl shadow-sm border border-gray-200">
            <div className="mx-auto w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mb-4">
              <FiUsers className="text-gray-400 text-2xl" />
            </div>
            <h3 className="text-lg font-medium text-gray-800 mb-2">
              {data.length === 0 ? "No attendees yet" : "No matches found"}
            </h3>
            <p className="text-gray-600 max-w-md mx-auto">
              {data.length === 0 
                ? "Upload an Excel file to get started" 
                : `No results for "${searchQuery}"`}
            </p>
          </div>
        ) : (
          <div className="grid gap-4">
            {filteredData.map((user, index) => (
              <UserCard
                eventId={id}
                key={user._id || index}
                user={user}
                searchQuery={searchQuery}
                selectedByOptions={getSelectedByOptions()}
                timeSlots={generateTimeSlots()}
                onUserUpdated={()=>refetch(id)}
                onUserDeleted={()=>refetch(id)}
              />
            ))}
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {showDeleteConfirm && (
          <div className="fixed inset-0 bg-black/50 bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Confirm Deletion</h3>
                <button 
                  onClick={() => setShowDeleteConfirm(false)}
                  className="text-gray-400 hover:text-gray-500"
                >
                  <FiX size={20} />
                </button>
              </div>
              
              <p className="text-gray-600 mb-6">
                Are you sure you want to delete all attendee data? This action cannot be undone.
              </p>
              
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={deleteData}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg text-white flex items-center gap-2 transition-colors"
                >
                  <FiTrash2 size={16} />
                  Delete All
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default FileUpload;