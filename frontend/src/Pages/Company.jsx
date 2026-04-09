import React, { useContext, useState, useEffect } from "react";
import { DataContext } from "../Context/DataContext";
import Axios from "../Api/Axios";
import { useParams } from "react-router-dom";
import { UserContext } from "../Context/UserContext";
import { BsGift, BsGiftFill } from "react-icons/bs";
import { BiCommentAdd, BiCommentEdit } from "react-icons/bi";
import { useToast } from "../Context/ToastContext";


const Company = () => {
  const [commentModal, setCommentModal] = useState({ open: false, userId: null, slotId: null, initial: "" });
  const [commentValue, setCommentValue] = useState("");
  const [commentLoading, setCommentLoading] = useState(false);
  const { id } = useParams();
  const { refetch, fileUserData, getUniqueCompanies } = useContext(DataContext);
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingCompanies, setLoadingCompanies] = useState(false);
  const [updatingId, setUpdatingId] = useState(null);
  const [error, setError] = useState(null);
  const [count, setCount] = useState(0);
  const [companies, setCompanies] = useState([]);
  const [selectedCompany, setSelectedCompany] = useState();
  const { user: loggedInUser } = useContext(UserContext);
  const { toast } = useToast();
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [confirmationData, setConfirmationData] = useState({
    slotId: null,
    isCompleted: false,
    userName: "",
  });

  useEffect(() => {
    if (id) {
      refetch(id);
    }
  }, [id]);

  // Fetch companies with slot counts
  useEffect(() => {
    const fetchCompanies = async () => {
      setLoadingCompanies(true);
      const allCompanyNames = getUniqueCompanies();
      try {
        const response = await Axios.post("/slot/get-company-slot-counts", {
          event: id,
        });

        const apiCompanies = response.data || [];

        // 3. Create a map for quick lookup of API data
        const apiCompanyMap = new Map();
        apiCompanies.forEach((company) => {
          apiCompanyMap.set(company.company, {
            slotCount: company.slotCount,
            userCount: company.userCount || 0,
          });
        });
        console.log(allCompanyNames);

        const combined = allCompanyNames.map((companyName) => ({
          company: companyName,
          slotCount: apiCompanyMap.get(companyName)?.slotCount || 0,
          userCount: apiCompanyMap.get(companyName)?.userCount || 0,
        }));

        combined.sort((a, b) => {
          if (b.userCount !== a.userCount) {
            return b.userCount - a.userCount;
          }
          return a.company.localeCompare(b.company);
        });

        setCompanies(combined);
      } catch (error) {
        console.error("Error fetching companies:", error);
        setError("Failed to load companies");
      } finally {
        setLoadingCompanies(false);
      }
    };

    if (id && fileUserData) {
      fetchCompanies();
    }
  }, [fileUserData]);

  const fetchUsers = async (companyName) => {
    const encodedCompanyName = encodeURIComponent(companyName);
    setSelectedCompany(companyName);
    setIsLoading(true);
    setError(null);

    try {
      const response = await Axios.post(`/slot/company/${encodedCompanyName}`, {
        event: id,
      });
      if (response.status >= 300) {
        throw new Error("Failed to fetch users");
      }
      const slots = response.data;

      const uniqueUsersMap = new Map();
      slots.forEach((slot) => {
        const user = slot.userId;
        if (user && !uniqueUsersMap.has(user._id)) {
          uniqueUsersMap.set(user._id, {
            ...user,
            slotId: slot._id,
            completed: slot.completed,
          });
        }
      });

      setUsers(Array.from(uniqueUsersMap.values()));
      setCount(uniqueUsersMap.size);
    } catch (error) {
      console.error("Error fetching users:", error);
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleClick = (slotId, isCompleted, userName) => {
    setConfirmationData({
      slotId,
      isCompleted,
      userName,
    });
    setShowConfirmation(true);
  };

  const toggleCompletion = async () => {
    const { slotId, isCompleted } = confirmationData;
    setUpdatingId(slotId);
    setShowConfirmation(false);

    try {
      const response = await Axios.post(`/slot/toggle-completed/${slotId}`, {
        completed: !isCompleted,
      });

      if (response.status >= 300) throw new Error("Failed to update status");

      if (selectedCompany) fetchUsers(selectedCompany);
    } catch (error) {
      console.error("Error updating slot status:", error);
      toast(error.response?.data?.message || "Failed to update status", "error");
    } finally {
      setUpdatingId(null);
    }
  };

  // Open modal with initial value when triggered
  useEffect(() => {
    if (commentModal.open) {
      setCommentValue(commentModal.initial || "");
    }
  }, [commentModal.open, commentModal.initial]);

  const handleGiftClick = async (userId) => {
    try {
        await Axios.put(`/files/user/${userId}`, {
          giftCollected: true,
        });
        if (selectedCompany) fetchUsers(selectedCompany);
      } catch (err) {
        toast(err.response?.data?.error || "Failed to update user.", "error");
      } 
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {showConfirmation && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-[#1a1a1a] border border-white/10 rounded-lg max-w-md w-full p-6">
            <h3 className="text-sm font-semibold text-white mb-2">{confirmationData.isCompleted ? "Mark as Incomplete?" : "Mark as Completed?"}</h3>
            <p className="text-white/40 text-xs mb-5">Mark <span className="text-white/70 font-medium">{confirmationData.userName}</span>'s interview as {confirmationData.isCompleted ? "incomplete" : "completed"}?</p>
            <div className="flex justify-end gap-2">
              <button onClick={() => setShowConfirmation(false)} className="px-4 py-2 text-xs border border-white/10 rounded-md text-white/50 hover:text-white transition-colors">Cancel</button>
              <button onClick={toggleCompletion} className="px-4 py-2 text-xs bg-amber-500 hover:bg-amber-400 text-black font-semibold rounded-md transition-colors">Confirm</button>
            </div>
          </div>
        </div>
      )}

      {commentModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70">
          <div className="bg-[#1a1a1a] border border-white/10 rounded-xl w-full max-w-md p-6">
            <h3 className="text-sm font-semibold text-white mb-4">{commentModal.initial ? "Edit Comment" : "Add Comment"}</h3>
            <form onSubmit={async (e) => {
              e.preventDefault();
              if (!commentValue.trim()) return;
              setCommentLoading(true);
              try {
                await Axios.put("/files/user/" + commentModal.userId, { comment: commentValue });
                setCommentModal({ open: false, userId: null, slotId: null, initial: "" });
                if (selectedCompany) fetchUsers(selectedCompany);
              } catch (err) { toast(err.response?.data?.error || "Failed to save comment.", "error"); }
              finally { setCommentLoading(false); }
            }} className="flex flex-col gap-3">
              <textarea className="bg-white/5 border border-white/10 rounded-md px-3 py-2 text-sm text-white placeholder-white/20 focus:outline-none focus:border-amber-500 resize-none" placeholder="Enter comment..." value={commentValue} onChange={e => setCommentValue(e.target.value)} required autoFocus rows={4} />
              <div className="flex gap-2 justify-end">
                <button type="button" className="px-4 py-1.5 text-xs border border-white/10 rounded-md text-white/50 hover:text-white transition-colors" onClick={() => setCommentModal({ open: false, userId: null, slotId: null, initial: "" })} disabled={commentLoading}>Cancel</button>
                <button type="submit" className="px-4 py-1.5 text-xs bg-amber-500 hover:bg-amber-400 text-black font-semibold rounded-md disabled:opacity-50 transition-colors" disabled={commentLoading || !commentValue.trim()}>{commentLoading ? "Saving..." : "Save"}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-xl font-bold text-white">Company Dashboard</h1>
          <p className="text-white/40 text-sm mt-0.5">Select a company to view and manage interviews</p>
        </div>

        {loadingCompanies ? (
          <div className="flex justify-center py-10"><div className="animate-spin rounded-full h-8 w-8 border-t-2 border-amber-500" /></div>
        ) : companies.length > 0 ? (
          <div className="mb-8">
            <p className="text-[10px] font-semibold text-white/20 uppercase tracking-wider mb-3">Available Companies</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2">
              {companies.map(company => (
                <button key={company.company} onClick={() => fetchUsers(company.company)}
                  className={`p-3 rounded-lg text-sm font-medium transition-all text-center w-full border ${selectedCompany === company.company ? 'bg-amber-500/20 border-amber-500/40 text-amber-400' : 'bg-white/5 border-white/10 text-white/60 hover:bg-white/10 hover:text-white'}`}>
                  <span className="truncate block text-xs">{company.company}</span>
                  <span className="text-[10px] opacity-60 mt-0.5 block">{company.slotCount} slot{company.slotCount !== 1 ? "s" : ""}</span>
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="bg-[#1a1a1a] border border-white/10 rounded-xl p-8 text-center mb-8">
            <p className="text-white/30 text-sm">No companies have booked slots for this event</p>
          </div>
        )}

        <div className="bg-[#1a1a1a] border border-white/10 rounded-xl overflow-hidden">
          <div className="px-5 py-4 border-b border-white/5 flex justify-between items-center">
            <h2 className="text-sm font-semibold text-white">{selectedCompany ? selectedCompany + " — Users" : "Select a company"}</h2>
            {selectedCompany && <span className="text-xs bg-white/10 text-white/50 px-2 py-0.5 rounded">{count} {count === 1 ? "user" : "users"}</span>}
          </div>
          <div className="p-5">
            {isLoading ? (
              <div className="flex justify-center py-8"><div className="animate-spin rounded-full h-8 w-8 border-t-2 border-amber-500" /></div>
            ) : error ? (
              <p className="text-red-400 text-sm text-center py-4">{error}</p>
            ) : users.length > 0 ? (
              <div className="space-y-3">
                {users.map(user => (
                  <div key={user._id} className={`p-4 rounded-lg border-l-4 flex flex-col gap-3 ${user.completed ? 'border-emerald-500 bg-emerald-500/5' : 'border-amber-500 bg-white/5'}`}>
                    <div className="flex flex-col sm:flex-row justify-between gap-3">
                      <div className="flex items-start gap-3">
                        <div className="w-9 h-9 rounded-full bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400 font-bold text-xs flex-shrink-0">
                          {user.firstName.charAt(0)}{user.lastName.charAt(0)}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-white">{user.firstName} {user.lastName}</p>
                          <p className="text-xs text-white/40">{user.email}</p>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {user.title && <span className="text-[10px] bg-white/5 text-white/40 px-2 py-0.5 rounded">{user.title}</span>}
                            {user.phone && <span className="text-[10px] bg-white/5 text-white/40 px-2 py-0.5 rounded">{user.phone}</span>}
                          </div>
                        </div>
                      </div>
                      <div className="flex-shrink-0 sm:w-36 flex flex-col gap-2">
                        <button onClick={() => handleToggleClick(user.slotId, user.completed, user.firstName + " " + user.lastName)}
                          disabled={updatingId === user.slotId || loggedInUser.role === "viewer"}
                          className={`w-full px-3 py-1.5 text-xs font-medium rounded-md disabled:opacity-40 transition-colors ${user.completed ? 'bg-amber-500/20 text-amber-400 hover:bg-amber-500/30' : 'bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30'}`}>
                          {updatingId === user.slotId ? "..." : user.completed ? "Mark Incomplete" : "Mark Completed"}
                        </button>
                        <div className="flex items-center gap-2">
                          <button onClick={() => setCommentModal({ open: true, userId: user._id, slotId: user.slotId, initial: user.comment || "" })}
                            disabled={updatingId === user.slotId || loggedInUser.role === "viewer"}
                            className="text-white/30 hover:text-amber-400 transition-colors text-base">
                            {user.comment ? <BiCommentEdit /> : <BiCommentAdd />}
                          </button>
                          {user.comment && (
                            <button onClick={() => handleGiftClick(user._id)}>
                              {user.giftCollected
                                ? <div className="flex items-center gap-1 text-xs text-emerald-400"><BsGiftFill /><span>{user.giftBy?.username}</span></div>
                                : <BsGift className="text-white/30 hover:text-amber-400 transition-colors cursor-pointer" />}
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                    {user.comment && <div className="text-xs text-white/40 bg-white/5 rounded px-3 py-2 break-words">{user.comment}</div>}
                  </div>
                ))}
              </div>
            ) : selectedCompany ? (
              <p className="text-white/30 text-sm text-center py-8">No users found for {selectedCompany}</p>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Company;
