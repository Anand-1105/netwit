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
      {/* Confirmation Dialog */}
      {showConfirmation && (
        <div className="fixed inset-0 bg-black/50  flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              {confirmationData.isCompleted
                ? "Mark as Incomplete?"
                : "Mark as Completed?"}
            </h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to mark{" "}
              <span className="font-semibold">{confirmationData.userName}</span>
              's interview as{" "}
              {confirmationData.isCompleted ? "incomplete" : "completed"}?
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowConfirmation(false)}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Cancel
              </button>
              <button
                onClick={toggleCompletion}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Comment Modal */}
      {commentModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-md p-6 relative">
            <h3 className="text-lg font-semibold mb-2">
              {commentModal.initial ? "Edit Comment" : "Add Comment"}
            </h3>
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                if (!commentValue.trim()) return;
                setCommentLoading(true);
                try {
                  await Axios.put(`/files/user/${commentModal.userId}`, {
                    comment: commentValue,
                  });
                  setCommentModal({
                    open: false,
                    userId: null,
                    slotId: null,
                    initial: "",
                  });
                  if (selectedCompany) fetchUsers(selectedCompany);
                } catch (err) {
                  toast(err.response?.data?.error || "Failed to save comment.", "error");
                } finally {
                  setCommentLoading(false);
                }
              }}
              className="flex flex-col gap-3"
            >
              <textarea
                className="border rounded px-3 py-2 w-full"
                placeholder="Enter comment..."
                value={commentValue}
                onChange={(e) => setCommentValue(e.target.value)}
                required
                autoFocus
                rows={4}
              />
              <div className="flex gap-2 justify-end">
                <button
                  type="button"
                  className="bg-gray-200 text-gray-700 px-4 py-1.5 rounded hover:bg-gray-300"
                  onClick={() =>
                    setCommentModal({
                      open: false,
                      userId: null,
                      slotId: null,
                      initial: "",
                    })
                  }
                  disabled={commentLoading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-blue-600 text-white px-4 py-1.5 rounded hover:bg-blue-700 disabled:opacity-50"
                  disabled={commentLoading || !commentValue.trim()}
                >
                  {commentLoading ? "Saving..." : "Save"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-10">
          <h1 className="text-4xl font-extrabold text-gray-900 mb-2 tracking-tight">
            Company Dashboard
          </h1>
          <p className="text-lg text-gray-600">
            Select a company to view and manage user interviews
          </p>
        </div>

        {loadingCompanies ? (
          <div className="flex justify-center py-10">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        ) : companies.length > 0 ? (
          <div className="mb-12">
            <h2 className="text-xl font-semibold text-gray-700 mb-4 px-2">
              Available Companies
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
              {companies.map((company) => (
                <button
                  key={company.company}
                  onClick={() => fetchUsers(company.company)}
                  className={`p-3 rounded-xl text-base font-medium transition-all duration-300 text-center w-full 
                                        ${
                                          selectedCompany === company.company
                                            ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg transform scale-[1.02] ring-2 ring-blue-300"
                                            : "bg-white text-gray-700 hover:bg-gray-50 hover:shadow-md border border-gray-200"
                                        }
                                        hover:shadow-md hover:-translate-y-0.5
                                    `}
                >
                  <span className="truncate block">{company.company}</span>
                  <span className="text-sm opacity-80">
                    {company.slotCount} slot{company.slotCount !== 1 ? "s" : ""}
                  </span>
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-xl p-6 shadow-sm text-center border-2 border-dashed border-gray-200">
            <svg
              className="mx-auto h-12 w-12 text-gray-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1}
                d="M9 13h6m-3-3v6m-9 1V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z"
              />
            </svg>
            <h3 className="mt-2 text-lg font-medium text-gray-900">
              No companies available
            </h3>
            <p className="mt-1 text-gray-500">
              No companies have booked slots for this event
            </p>
          </div>
        )}

        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          <div className="px-6 py-5 border-b border-gray-200 flex justify-between items-center">
            <h2 className="text-xl font-semibold text-gray-800">
              {selectedCompany
                ? `${selectedCompany} Users`
                : "Select a company"}
            </h2>
            {selectedCompany && (
              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                {count} {count === 1 ? "user" : "users"}
              </span>
            )}
          </div>

          <div className="p-6">
            {isLoading ? (
              <div className="flex justify-center py-10">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
              </div>
            ) : error ? (
              <div className="p-4 bg-red-50 rounded-lg border border-red-200 flex items-start">
                <svg
                  className="h-5 w-5 text-red-500 mr-3 mt-0.5"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                    clipRule="evenodd"
                  />
                </svg>
                <div>
                  <h3 className="text-sm font-medium text-red-800">
                    Error loading users
                  </h3>
                  <p className="mt-1 text-sm text-red-700">{error}</p>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {users.length > 0
                  ? users.map((user) => (
                      <div
                        key={user._id}
                        className={`p-5 rounded-xl transition-all duration-200 border-l-[6px] flex flex-col justify-between gap-4
                                                ${
                                                  user.completed
                                                    ? "bg-green-50 border-green-500 hover:shadow-sm"
                                                    : "bg-gray-50 border-blue-500 hover:shadow-sm"
                                                }
                                            `}
                      >
                       <div className="flex flex-col sm:flex-row justify-between">
                       <div className="flex-1">
                          <div className="flex items-start space-x-3">
                            <div className="flex-shrink-0 h-10 w-10 rounded-full bg-gradient-to-r from-blue-500 to-indigo-500 flex items-center justify-center text-white font-medium">
                              {user.firstName.charAt(0)}
                              {user.lastName.charAt(0)}
                            </div>
                            <div>
                              <h3 className="text-lg font-medium text-gray-900">
                                {user.firstName} {user.lastName}
                              </h3>
                              <p className="text-sm text-gray-500">
                                {user.email}
                              </p>
                              <div className="mt-1 flex flex-wrap gap-1">
                                {user.title && (
                                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                                    {user.title}
                                  </span>
                                )}
                                {user.phone && (
                                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                    {user.phone}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                          {user.selectedBy?.some((c) => c.selected) && (
                            <div className="mt-3">
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                Scheduled with:{" "}
                                {user.selectedBy
                                  .filter((c) => c.selected)
                                  .map((c) => c.name)
                                  .join(", ")}
                              </span>
                            </div>
                          )}
                        </div>
                        <div className="flex-shrink-0 sm:w-40">
                          <button
                            onClick={() =>
                              handleToggleClick(
                                user.slotId,
                                user.completed,
                                `${user.firstName} ${user.lastName}`
                              )
                            }
                            className={`w-full px-4 py-2 disabled:opacity-40 disabled:cursor-not-allowed rounded-lg text-sm font-medium transition-colors duration-200 flex items-center justify-center space-x-2
                                                        ${
                                                          user.completed
                                                            ? "bg-yellow-100 text-yellow-800 hover:bg-yellow-200"
                                                            : "bg-blue-100 text-blue-800 hover:bg-blue-200"
                                                        }
                                                    `}
                            disabled={
                              updatingId === user.slotId ||
                              loggedInUser.role === "viewer" ||
                              user._editingComment
                            }
                          >
                            {updatingId === user.slotId ? (
                              <>
                                <svg
                                  className="animate-spin h-4 w-4 text-current"
                                  xmlns="http://www.w3.org/2000/svg"
                                  fill="none"
                                  viewBox="0 0 24 24"
                                >
                                  <circle
                                    className="opacity-25"
                                    cx="12"
                                    cy="12"
                                    r="10"
                                    stroke="currentColor"
                                    strokeWidth="4"
                                  ></circle>
                                  <path
                                    className="opacity-75"
                                    fill="currentColor"
                                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                  ></path>
                                </svg>
                                <span>Processing</span>
                              </>
                            ) : user.completed ? (
                              "Mark Incomplete"
                            ) : (
                              "Mark Completed"
                            )}
                          </button>
                          {/* Comment Feature */}
                          <div className="mt-2 flex items-center gap-2">
                            <button
                              className="mt-1 text-xl text-blue-600 underline hover:text-blue-900"
                              onClick={() => {
                                setCommentModal({
                                  open: true,
                                  userId: user._id,
                                  slotId: user.slotId,
                                  initial: user.comment || "",
                                });
                              }}
                              disabled={
                                updatingId === user.slotId ||
                                loggedInUser.role === "viewer"
                              }
                            >
                              {user.comment ? <BiCommentEdit /> : <BiCommentAdd />}
                            </button>
                            {user.comment&&(
                                <button onClick={()=>handleGiftClick(user._id)}>
                                {user.giftCollected?<div className="gap-1 p-1 px-2 bg-white rounded-full flex items-center"><BsGiftFill className="text-green-500 cursor-not-allowed" /><span>{user.giftBy.username}</span></div>:<BsGift className="cursor-pointer" /> }  
                                </button>
                            )}
                          </div>
                        </div>
                       </div>
                          {user.comment && (
            <div className="text-xs text-gray-700 mb-1 break-words bg-gray-100 rounded px-2 py-1">
              {user.comment}
            </div>
          )}
                      </div>
                    ))
                  : selectedCompany &&
                    !isLoading && (
                      <div className="text-center py-10">
                        <svg
                          className="mx-auto h-12 w-12 text-gray-400"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={1}
                            d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
                          />
                        </svg>
                        <h3 className="mt-2 text-lg font-medium text-gray-900">
                          No users found
                        </h3>
                        <p className="mt-1 text-gray-500">
                          No users found for {selectedCompany}
                        </p>
                      </div>
                    )}
              </div>
            )}
          </div>
          
        </div>
      </div>
    </div>
  );
};

export default Company;
