import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Select from "react-select";
import Axios from "../Api/Axios";

const UpdateEvent = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updateLoading, setUpdateLoading] = useState(false);
  const [error, setError] = useState("");
  const [users, setUsers] = useState([]);
  
  const [form, setForm] = useState({
    title: "",
    image: "",
    description: "",
    startDate: "",
    endDate: "",
    assignedTo: [],
    slotGap: "",
  });

  const currentUserId = localStorage.getItem("userId");

 useEffect(() => {
  const fetchData = async () => {
    try {
      // First fetch users list (if still needed for other purposes)
      const usersResponse = await Axios.post("/auth/users-list");
      const usersData = usersResponse.data.users || [];
      setUsers(usersData);
      
      // Then fetch event details
      const eventResponse = await Axios.get(`/events/${id}`);
      const eventData = eventResponse.data;
      setEvent(eventData);
      
      // Transform assignedTo array (which contains full user objects) to react-select format
      const assignedToOptions = eventData.assignedTo?.map(user => ({
        value: user._id,
        label: `${user.username} (${user.email})`
      })) || [];

      setForm({
        title: eventData.title || "",
        image: eventData.image || "",
        description: eventData.description || "",
        startDate: eventData.startDate ? eventData.startDate.slice(0, 16) : "",
        endDate: eventData.endDate ? eventData.endDate.slice(0, 16) : "",
        assignedTo: assignedToOptions,
        slotGap: eventData.slotGap || "",
      });
    } catch (err) {
      setError("Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  fetchData();
}, [id]);

  // Rest of your component remains the same...
  const userOptions = users.map(user => ({
    value: user._id,
    label: `${user.username} (${user.email})`
  }));

  const slotGapOptions = [
    { value: 15, label: '15 min' },
    { value: 20, label: '20 min' },
    { value: 30, label: '30 min' }
  ];

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleAssignedToChange = (selectedOptions) => {
    setForm({ ...form, assignedTo: selectedOptions || [] });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setUpdateLoading(true);

    if (!form.title || form.assignedTo.length === 0) {
      setError("Title and Assigned To are required.");
      setUpdateLoading(false);
      return;
    }

    if (form.startDate && form.endDate && new Date(form.endDate) <= new Date(form.startDate)) {
      setError("End date must be after start date.");
      setUpdateLoading(false);
      return;
    }

    try {
      const assignedUserIds = form.assignedTo.map(option => option.value);
      
      const updateData = {
        title: form.title,
        image: form.image,
        description: form.description,
        startDate: form.startDate,
        endDate: form.endDate,
        assignedTo: assignedUserIds,
        slotGap: parseInt(form.slotGap) || null,
      };

      await Axios.put(`/events/${id}`, updateData);
      navigate("/app");
    } catch (err) {
      setError(err?.response?.data?.error || "Update failed");
    } finally {
      setUpdateLoading(false);
    }
  };

  // Custom styles for react-select to match your design
  const customStyles = {
    control: (provided, state) => ({
      ...provided,
      border: '1px solid #d1d5db',
      borderRadius: '0.375rem',
      padding: '0.125rem',
      boxShadow: state.isFocused ? '0 0 0 1px #3b82f6' : 'none',
      borderColor: state.isFocused ? '#3b82f6' : '#d1d5db',
      '&:hover': {
        borderColor: state.isFocused ? '#3b82f6' : '#d1d5db'
      }
    }),
    multiValue: (provided) => ({
      ...provided,
      backgroundColor: '#eff6ff',
      borderRadius: '0.25rem'
    }),
    multiValueLabel: (provided) => ({
      ...provided,
      color: '#1e40af'
    }),
    multiValueRemove: (provided) => ({
      ...provided,
      color: '#1e40af',
      '&:hover': {
        backgroundColor: '#dbeafe',
        color: '#1e40af'
      }
    })
  };

  if (loading) return <div className="max-w-2xl mx-auto py-12 px-4 text-center">Loading...</div>;
  if (!event) return <div className="max-w-2xl mx-auto py-12 px-4 text-center">Event not found</div>;
console.log(event);

  return (
    <div className="max-w-2xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
      <h2 className="text-3xl font-bold mb-8">Update Event</h2>
      <form onSubmit={handleSubmit} className="space-y-6 bg-white p-8 rounded-xl shadow">
        {error && <div className="text-red-500">{error}</div>}
        
        <div>
          <label className="block font-medium mb-1">Title</label>
          <input
            type="text"
            name="title"
            value={form.title}
            onChange={handleChange}
            className="w-full border rounded px-3 py-2"
            required
          />
        </div>

        {/* <div>
          <label className="block font-medium mb-1">Image URL</label>
          <input
            type="text"
            name="image"
            value={form.image}
            onChange={handleChange}
            className="w-full border rounded px-3 py-2"
          />
        </div> */}

        <div>
          <label className="block font-medium mb-1">Description</label>
          <textarea
            name="description"
            value={form.description}
            onChange={handleChange}
            className="w-full border rounded px-3 py-2"
          />
        </div>

        <div className="flex gap-4 flex-wrap">
          <div className="flex-1">
            <label className="block font-medium mb-1">Start Date</label>
            <input
              type="datetime-local"
              name="startDate"
              value={form.startDate}
              onChange={e => { setForm(f => ({ ...f, startDate: e.target.value, endDate: f.endDate && new Date(f.endDate) <= new Date(e.target.value) ? "" : f.endDate })); }}
              className="w-full border rounded px-3 py-2"
            />
          </div>
          <div className="flex-1">
            <label className="block font-medium mb-1">End Date</label>
            <input
              type="datetime-local"
              name="endDate"
              value={form.endDate}
              min={form.startDate || undefined}
              onChange={handleChange}
              className="w-full border rounded px-3 py-2"
            />
          </div>
        </div>

        <div>
          <label className="block font-medium mb-1">Assign To</label>
          <Select
            isMulti
            value={form.assignedTo}
            onChange={handleAssignedToChange}
            options={userOptions}
            styles={customStyles}
            placeholder="Select users..."
            noOptionsMessage={() => "No users found"}
            closeMenuOnSelect={false}
            hideSelectedOptions={false}
            isSearchable={true}
            isClearable={true}
          />
        </div>

        <div>
          <label className="block font-medium mb-1">Slot Gap</label>
          <select
            name="slotGap"
            value={form.slotGap}
            onChange={handleChange}
            className="w-full border rounded px-3 py-2"
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
          disabled={updateLoading}
          className="w-full bg-blue-600 text-white py-2 rounded font-semibold hover:bg-blue-700 transition"
        >
          {updateLoading ? "Updating..." : "Update Event"}
        </button>
      </form>
    </div>
  );
};

export default UpdateEvent;