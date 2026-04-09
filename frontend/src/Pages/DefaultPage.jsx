import React, { useEffect, useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import Axios, { BASE_URL } from "../Api/Axios";
import { FiPlus, FiEdit2, FiTrash2, FiCalendar, FiSearch, FiClock } from "react-icons/fi";
import { UserContext } from "../Context/UserContext";

const formatDate = (d) => {
    if (!d) return "—";
    return new Date(d).toLocaleString("en-US", {
        month: "short", day: "numeric", year: "numeric",
        hour: "2-digit", minute: "2-digit", hour12: true,
    });
};

const DeleteDialog = ({ event, onConfirm, onClose }) => (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
        <div className="bg-[#1a1a1a] border border-white/10 rounded-lg shadow-xl max-w-sm w-full p-6">
            <h3 className="font-semibold text-white mb-1">Delete event?</h3>
            <p className="text-sm text-white/40 mb-5">
                <span className="font-medium text-white/70">"{event.title}"</span> will be permanently removed.
            </p>
            <div className="flex justify-end gap-2">
                <button onClick={onClose} className="px-4 py-2 text-xs border border-white/10 rounded-md text-white/50 hover:text-white hover:border-white/20 transition-colors">Cancel</button>
                <button onClick={onConfirm} className="px-4 py-2 text-xs bg-red-500 hover:bg-red-400 text-white rounded-md transition-colors">Delete</button>
            </div>
        </div>
    </div>
);

const DefaultPage = () => {
    const navigate = useNavigate();
    const { user } = useContext(UserContext);
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [deleteTarget, setDeleteTarget] = useState(null);

    useEffect(() => {
        Axios.get("/events")
            .then(res => { setEvents(res.data); setLoading(false); })
            .catch(() => setLoading(false));
    }, []);

    const handleDelete = async () => {
        try {
            await Axios.delete(`/events/${deleteTarget._id}`);
            setEvents(prev => prev.filter(e => e._id !== deleteTarget._id));
            setDeleteTarget(null);
        } catch {
            // error handled silently — delete dialog stays open
        }
    };

    const filtered = events.filter(e =>
        e.title.toLowerCase().includes(search.toLowerCase()) ||
        (e.description || "").toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="p-6 max-w-5xl mx-auto">
            {deleteTarget && (
                <DeleteDialog
                    event={deleteTarget}
                    onConfirm={handleDelete}
                    onClose={() => setDeleteTarget(null)}
                />
            )}

            {/* Page header */}
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-xl font-bold text-white">Events</h1>
                    <p className="text-sm text-white/40 mt-0.5">{events.length} total</p>
                </div>
                {user?.role === "admin" && (
                    <button
                        onClick={() => navigate("/app/create")}
                        className="flex items-center gap-2 bg-amber-500 hover:bg-amber-400 text-black text-sm font-semibold px-4 py-2 rounded-md transition-colors"
                    >
                        <FiPlus size={14} />
                        New Event
                    </button>
                )}
            </div>

            {/* Search */}
            <div className="relative mb-5">
                <FiSearch size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
                <input
                    type="text"
                    placeholder="Search events..."
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    className="w-full max-w-xs pl-9 pr-3 py-2 text-sm bg-white/5 border border-white/10 rounded-md text-white placeholder-white/20 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
                />
            </div>

            {/* Table */}
            {loading ? (
                <div className="space-y-2">
                    {[...Array(5)].map((_, i) => (
                        <div key={i} className="h-14 bg-white/5 rounded-md animate-pulse" />
                    ))}
                </div>
            ) : filtered.length === 0 ? (
                <div className="text-center py-20 text-white/20">
                    <FiCalendar size={32} className="mx-auto mb-3 opacity-40" />
                    <p className="text-sm">{search ? "No events match your search" : "No events yet"}</p>
                    {search && (
                        <button onClick={() => setSearch("")} className="mt-2 text-xs text-amber-500 hover:underline">
                            Clear search
                        </button>
                    )}
                </div>
            ) : (
                <div className="bg-[#1a1a1a] border border-white/10 rounded-lg overflow-hidden">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-white/5 bg-white/5">
                                <th className="text-left px-4 py-3 text-[10px] font-semibold text-white/30 uppercase tracking-wider">Event</th>
                                <th className="text-left px-4 py-3 text-[10px] font-semibold text-white/30 uppercase tracking-wider hidden md:table-cell">Start</th>
                                <th className="text-left px-4 py-3 text-[10px] font-semibold text-white/30 uppercase tracking-wider hidden md:table-cell">End</th>
                                <th className="text-left px-4 py-3 text-[10px] font-semibold text-white/30 uppercase tracking-wider hidden lg:table-cell">Slot Gap</th>
                                <th className="px-4 py-3 w-20"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {filtered.map(event => (
                                <tr
                                    key={event._id}
                                    onClick={() => navigate(`/app/event/${event._id}`)}
                                    className="hover:bg-white/5 cursor-pointer transition-colors"
                                >
                                    <td className="px-4 py-3">
                                        <div className="flex items-center gap-3">
                                            {event.image ? (
                                                <img src={BASE_URL + event.image} alt=""
                                                    className="w-8 h-8 rounded object-cover flex-shrink-0 border border-white/10" />
                                            ) : (
                                                <div className="w-8 h-8 rounded bg-amber-500/10 border border-amber-500/20 flex items-center justify-center flex-shrink-0">
                                                    <FiCalendar size={13} className="text-amber-500" />
                                                </div>
                                            )}
                                            <div>
                                                <p className="font-medium text-white/90">{event.title}</p>
                                                {event.description && (
                                                    <p className="text-xs text-white/30 truncate max-w-xs">{event.description}</p>
                                                )}
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-4 py-3 text-white/40 hidden md:table-cell whitespace-nowrap text-xs">{formatDate(event.startDate)}</td>
                                    <td className="px-4 py-3 text-white/40 hidden md:table-cell whitespace-nowrap text-xs">{formatDate(event.endDate)}</td>
                                    <td className="px-4 py-3 hidden lg:table-cell">
                                        {event.slotGap && (
                                            <span className="inline-flex items-center gap-1 text-xs text-white/30 bg-white/5 px-2 py-0.5 rounded">
                                                <FiClock size={10} />{event.slotGap} min
                                            </span>
                                        )}
                                    </td>
                                    <td className="px-4 py-3">
                                        {user?.role !== "viewer" && (
                                            <div className="flex items-center gap-1 justify-end" onClick={e => e.stopPropagation()}>
                                                <button onClick={() => navigate(`/app/event/update/${event._id}`)}
                                                    className="p-1.5 text-white/20 hover:text-white/70 hover:bg-white/5 rounded transition-colors">
                                                    <FiEdit2 size={13} />
                                                </button>
                                                <button onClick={() => setDeleteTarget(event)}
                                                    className="p-1.5 text-white/20 hover:text-red-400 hover:bg-red-500/10 rounded transition-colors">
                                                    <FiTrash2 size={13} />
                                                </button>
                                            </div>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};

export default DefaultPage;
