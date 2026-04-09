import React, { useContext } from "react";
import { useNavigate } from "react-router-dom";
import { UserContext } from "../Context/UserContext";
import { FiCalendar, FiArrowRight } from "react-icons/fi";

const LandingPage = () => {
    const navigate = useNavigate();
    const { isAuthenticated } = useContext(UserContext);

    return (
        <div className="min-h-screen bg-[#0f0f0f] text-white flex flex-col">

            {/* Nav */}
            <header className="px-8 py-5 flex items-center justify-between border-b border-white/5">
                <div className="flex items-center gap-2">
                    <span className="w-6 h-6 bg-amber-500 rounded flex items-center justify-center">
                        <FiCalendar size={13} className="text-white" />
                    </span>
                    <span className="font-semibold text-sm tracking-tight">MeetApp</span>
                </div>
                <button
                    onClick={() => navigate(isAuthenticated ? "/app" : "/login")}
                    className="text-sm text-white/60 hover:text-white transition-colors"
                >
                    {isAuthenticated ? "Open app" : "Sign in"} →
                </button>
            </header>

            {/* Main */}
            <main className="flex-1 flex flex-col items-center justify-center px-6 text-center">
                <p className="text-xs text-amber-500 font-mono tracking-widest uppercase mb-6">
                    India CIO Summit
                </p>

                <h1 className="text-5xl sm:text-7xl font-bold tracking-tight leading-none mb-6 max-w-3xl">
                    Meeting room<br />
                    <span className="text-white/30">booking, done right.</span>
                </h1>

                <p className="text-white/50 text-base sm:text-lg max-w-md leading-relaxed mb-10">
                    Import attendees from Excel, book meeting slots with companies,
                    track completions, and export reports — all in one place.
                </p>

                <button
                    onClick={() => navigate(isAuthenticated ? "/app" : "/login")}
                    className="group flex items-center gap-2 bg-white text-black text-sm font-semibold px-6 py-3 rounded-full hover:bg-amber-400 transition-colors"
                >
                    {isAuthenticated ? "Go to dashboard" : "Sign in to continue"}
                    <FiArrowRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
                </button>
            </main>

            {/* Bottom strip */}
            <footer className="px-8 py-5 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-8 text-xs text-white/30 font-mono">
                    <span>Attendee import</span>
                    <span>·</span>
                    <span>Slot booking</span>
                    <span>·</span>
                    <span>Company tracking</span>
                    <span>·</span>
                    <span>Excel reports</span>
                </div>
                <span className="text-xs text-white/20">Built for summit ops teams</span>
            </footer>
        </div>
    );
};

export default LandingPage;
