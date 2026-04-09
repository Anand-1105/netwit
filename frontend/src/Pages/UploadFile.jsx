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
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
          <div>
            <h1 className="text-xl font-bold text-white">Conference Room Booking System</h1>
            <p className="text-white/40 text-sm mt-0.5">
              Manage attendee schedules and meeting slots
              {eventData?.slotGap && <span className="ml-2 text-xs bg-amber-500/20 text-amber-400 px-2 py-0.5 rounded">{eventData.slotGap} min slots</span>}
            </p>
          </div>
          <div className="flex items-center flex-wrap gap-3">
            <DownloadReport id={id} />
            <div className="flex items-center gap-2 bg-white/5 border border-white/10 px-3 py-2 rounded-md">
              <FiUsers size={13} className="text-white/40" />
              <span className="text-xs text-white/60">{data.length} {data.length === 1 ? 'Attendee' : 'Attendees'}</span>
            </div>
            <button disabled={user.role === "viewer"} onClick={() => setShowSignupModal(true)}
              className="flex items-center gap-2 bg-amber-500 hover:bg-amber-400 disabled:opacity-40 disabled:cursor-not-allowed text-black text-xs font-semibold px-4 py-2 rounded-md transition-colors">
              <FiPlus size={13} /> Assign User
            </button>
          </div>
        </div>

        {showSignupModal && (
          <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
            <div className="bg-[#1a1a1a] border border-white/10 rounded-xl w-full max-w-md relative max-h-[90vh] overflow-y-auto">
              <button onClick={() => setShowSignupModal(false)} className="absolute top-4 right-4 text-white/40 hover:text-white z-10"><FiX size={18} /></button>
              <SignUp2 eventId={id} onSuccess={() => { setShowSignupModal(false); refetch(id); }} />
            </div>
          </div>
        )}

        {user.role !== "viewer" && (
          <div className="bg-[#1a1a1a] border border-white/10 rounded-xl p-5 mb-6">
            <p className="text-xs font-semibold text-white/40 uppercase tracking-wider mb-4">Upload Attendee List</p>
            <div className="flex flex-col md:flex-row gap-3 items-center">
              <label className="flex-1 w-full cursor-pointer group">
                <div className={`flex items-center gap-3 p-4 border border-dashed rounded-lg transition-all ${file ? 'border-amber-500/50 bg-amber-500/5' : 'border-white/10 group-hover:border-white/20'}`}>
                  <div className={`p-2 rounded-md transition-colors ${file ? 'bg-amber-500/20 text-amber-400' : 'bg-white/5 text-white/30 group-hover:text-white/50'}`}><FiUpload size={16} /></div>
                  <div className="flex-1 min-w-0">
                    {file ? <p className="text-sm text-white/80 truncate">{file.name}</p> : <p className="text-sm text-white/30"><span className="text-amber-500">Browse files</span> or drag and drop</p>}
                    <p className="text-xs text-white/20 mt-0.5">Excel files (.xlsx, .xls)</p>
                  </div>
                </div>
                <input type="file" onChange={handleFileChange} className="hidden" accept=".xlsx,.xls" />
              </label>
              <button type="button" onClick={() => window.open('/format.xlsx', '_blank')}
                className="flex items-center gap-2 bg-white/5 hover:bg-white/10 border border-white/10 text-white/50 text-xs px-4 py-3 rounded-lg transition-colors">
                <FiDownload size={13} /> Format
              </button>
              <button onClick={handleUpload} disabled={loading || !file}
                className={`flex items-center gap-2 px-5 py-3 rounded-lg text-xs font-semibold transition-all min-w-[120px] justify-center ${loading ? 'bg-amber-500/50 cursor-wait text-black' : !file ? 'bg-white/5 text-white/20 cursor-not-allowed' : 'bg-amber-500 hover:bg-amber-400 text-black'}`}>
                {loading ? "Uploading..." : <><FiUpload size={13} /> Upload</>}
              </button>
            </div>
          </div>
        )}

        <div className="mb-5 flex flex-col sm:flex-row gap-3 items-start sm:items-center">
          <div className="relative flex-1 w-full">
            <FiSearch size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
            <input type="text" placeholder="Search attendees..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
              className="block w-full pl-9 pr-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-sm text-white placeholder-white/20 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500" />
          </div>
          <div className="flex gap-2">
            {searchQuery && (
              <button onClick={() => setSearchQuery("")} className="flex items-center gap-1.5 px-3 py-2.5 bg-white/5 hover:bg-white/10 rounded-lg text-white/40 text-xs transition-colors">
                <FiX size={13} /> Clear
              </button>
            )}
            <button disabled={user.role === "viewer"} onClick={() => setShowDeleteConfirm(true)}
              className="flex items-center gap-1.5 px-3 py-2.5 bg-red-500/10 hover:bg-red-500/20 rounded-lg disabled:opacity-30 disabled:cursor-not-allowed text-red-400 text-xs transition-colors">
              <FiTrash2 size={13} /> Delete All
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2 text-white/30 text-xs mb-5">
          <FiClock size={12} className="text-amber-500/60" />
          Showing {filteredData.length} of {data.length} attendees
        </div>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-12 bg-[#1a1a1a] border border-white/10 rounded-xl">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-amber-500 mb-3" />
            <p className="text-white/30 text-sm">Loading attendee data...</p>
          </div>
        ) : filteredData.length === 0 ? (
          <div className="text-center p-12 bg-[#1a1a1a] border border-white/10 rounded-xl">
            <FiUsers size={28} className="mx-auto text-white/20 mb-3" />
            <p className="text-sm text-white/40">{data.length === 0 ? "Upload an Excel file to get started" : `No results for "${searchQuery}"`}</p>
          </div>
        ) : (
          <div className="grid gap-3">
            {filteredData.map((user, index) => (
              <UserCard eventId={id} key={user._id || index} user={user} searchQuery={searchQuery}
                selectedByOptions={getSelectedByOptions()} timeSlots={generateTimeSlots()}
                onUserUpdated={() => refetch(id)} onUserDeleted={() => refetch(id)} />
            ))}
          </div>
        )}

        {showDeleteConfirm && (
          <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50">
            <div className="bg-[#1a1a1a] border border-white/10 rounded-xl max-w-md w-full p-6">
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-sm font-semibold text-white">Delete all attendees?</h3>
                <button onClick={() => setShowDeleteConfirm(false)} className="text-white/30 hover:text-white"><FiX size={16} /></button>
              </div>
              <p className="text-white/40 text-xs mb-5">This will permanently remove all attendee data for this event.</p>
              <div className="flex justify-end gap-2">
                <button onClick={() => setShowDeleteConfirm(false)} className="px-4 py-2 text-xs border border-white/10 rounded-md text-white/50 hover:text-white transition-colors">Cancel</button>
                <button onClick={deleteData} className="px-4 py-2 text-xs bg-red-500 hover:bg-red-400 text-white rounded-md flex items-center gap-1.5 transition-colors">
                  <FiTrash2 size={12} /> Delete All
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