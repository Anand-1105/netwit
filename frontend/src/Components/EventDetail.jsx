import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import Axios from "../Api/Axios";
import { BASE_URL } from "../Api/Axios";

const formatDateTime = (dateString) => {
  if (!dateString) return "N/A";
  const date = new Date(dateString);
  return date.toLocaleString('en-US', {
    weekday: 'short', month: 'long', day: 'numeric',
    hour: '2-digit', minute: '2-digit', hour12: true
  });
};

const EventDetail = () => {
  const { id } = useParams();
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Axios.get(`/events/${id}`)
      .then(res => { setEvent(res.data); setLoading(false); })
      .catch(() => setLoading(false));
  }, [id]);

  if (loading) return <div className="p-8 text-slate-500">Loading...</div>;
  if (!event) return <div className="p-8 text-slate-500">Event not found</div>;

  return (
    <div className="max-w-xl mx-auto p-8 bg-white rounded-xl shadow border border-slate-100">
      {event.image && (
        <img
          src={BASE_URL + event.image}
          alt={event.title}
          className="mb-5 rounded-lg w-full object-cover max-h-56"
        />
      )}
      <h2 className="text-2xl font-bold text-slate-900 mb-2">{event.title}</h2>
      {event.description && <p className="text-slate-500 mb-4">{event.description}</p>}
      <div className="space-y-1 text-sm text-slate-600">
        <div><span className="font-medium">Start:</span> {formatDateTime(event.startDate)}</div>
        <div><span className="font-medium">End:</span> {formatDateTime(event.endDate)}</div>
        <div><span className="font-medium">Slot gap:</span> {event.slotGap} min</div>
      </div>
    </div>
  );
};

export default EventDetail;