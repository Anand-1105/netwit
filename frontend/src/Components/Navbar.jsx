import React, { useState, useContext } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { UserContext } from "../Context/UserContext";
import { FiMenu, FiX, FiUser, FiHome, FiCalendar, FiUsers, FiBriefcase } from "react-icons/fi";
import { MdKeyboardArrowDown, MdKeyboardArrowUp } from "react-icons/md";
import { useParams } from 'react-router-dom';

const Navbar = () => {
    const { id } = useParams(); 
    const { isAuthenticated, login, logout, user } = useContext(UserContext);
    const [isOpen, setIsOpen] = useState(false);
    const [profileOpen, setProfileOpen] = useState(false);
    const navigate = useNavigate();

    // Close all dropdowns when navigating
    const handleNavigation = () => {
        setIsOpen(false);
        setProfileOpen(false);
    };

    return (
        <nav className="bg-gradient-to-r from-blue-600 to-blue-500 shadow-lg">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-16">
                    {/* Logo & Desktop Navigation */}
                    <div className="flex items-center">
                        <div className="flex-shrink-0">
                            <Link to="/" className="text-white text-2xl font-bold flex items-center">
                                <FiCalendar className="mr-2" />
                                MeetApp
                            </Link>
                        </div>
                        
                        <div className="hidden md:block ml-10">
                            <div className="flex items-baseline space-x-4">
                                <NavLink 
                                    to="/dashboard" 
                                    className={({isActive}) => `px-3 py-2 rounded-md text-sm font-medium ${isActive ? 'bg-blue-700 text-white' : 'text-white hover:bg-blue-500 hover:bg-opacity-75'}`}
                                >
                                    <FiHome className="inline mr-1" /> Dashboard
                                </NavLink>
                                <NavLink 
                                    to="/event" 
                                    className={({isActive}) => `px-3 py-2 rounded-md text-sm font-medium ${isActive ? 'bg-blue-700 text-white' : 'text-white hover:bg-blue-500 hover:bg-opacity-75'}`}
                                >
                                    <FiCalendar className="inline mr-1" /> Events
                                </NavLink>
                                <NavLink 
                                    to="/users" 
                                    className={({isActive}) => `px-3 py-2 rounded-md text-sm font-medium ${isActive ? 'bg-blue-700 text-white' : 'text-white hover:bg-blue-500 hover:bg-opacity-75'}`}
                                >
                                    <FiUser className="inline mr-1" /> Users
                                </NavLink>
                                {id && (
                                    <>
                                        <NavLink 
                                            to={`/event/${id}/meeting`}
                                            className={({isActive}) => `px-3 py-2 rounded-md text-sm font-medium ${isActive ? 'bg-blue-700 text-white' : 'text-white hover:bg-blue-500 hover:bg-opacity-75'}`}
                                        >
                                            <FiUsers className="inline mr-1" /> Bookings
                                        </NavLink>
                                        <NavLink 
                                            to={`/event/${id}/company`}
                                            className={({isActive}) => `px-3 py-2 rounded-md text-sm font-medium ${isActive ? 'bg-blue-700 text-white' : 'text-white hover:bg-blue-500 hover:bg-opacity-75'}`}
                                        >
                                            <FiBriefcase className="inline mr-1" /> Companies
                                        </NavLink>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Desktop Profile & Auth */}
                    <div className="hidden md:block">
                        <div className="ml-4 flex items-center md:ml-6">
                            {isAuthenticated ? (
                                <div className="relative">
                                    <button
                                        className="max-w-xs bg-blue-700 rounded-full flex items-center text-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 px-4 py-2 text-white hover:bg-blue-600 transition"
                                        onClick={() => setProfileOpen(!profileOpen)}
                                    >
                                        <FiUser className="mr-2" />
                                        {user?.username || 'Profile'}
                                        {profileOpen ? <MdKeyboardArrowUp className="ml-1" /> : <MdKeyboardArrowDown className="ml-1" />}
                                    </button>

                                    {profileOpen && (
                                        <div className="origin-top-right absolute right-0 mt-2 w-48 rounded-md shadow-lg py-1 bg-white ring-1 ring-black ring-opacity-5 focus:outline-none z-50">
                                            <button
                                                onClick={() => {
                                                    logout();
                                                    handleNavigation();
                                                }}
                                                className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100"
                                            >
                                                Sign out
                                            </button>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <button 
                                    onClick={login}
                                    className="ml-4 px-4 py-2 rounded-md text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition"
                                >
                                    Login
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Mobile menu button */}
                    <div className="md:hidden flex items-center">
                        <button
                            onClick={() => setIsOpen(!isOpen)}
                            className="inline-flex items-center justify-center p-2 rounded-md text-white hover:text-white hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-white"
                        >
                            <span className="sr-only">Open main menu</span>
                            {isOpen ? <FiX className="block h-6 w-6" /> : <FiMenu className="block h-6 w-6" />}
                        </button>
                    </div>
                </div>
            </div>

            {/* Mobile menu */}
            {isOpen && (
                <div className="md:hidden bg-blue-700">
                    <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
                        <NavLink
                            to="/dashboard"
                            className="block px-3 py-2 rounded-md text-base font-medium text-white hover:bg-blue-600"
                            onClick={handleNavigation}
                        >
                            <FiHome className="inline mr-2" /> Dashboard
                        </NavLink>
                        <NavLink
                            to="/event"
                            className="block px-3 py-2 rounded-md text-base font-medium text-white hover:bg-blue-600"
                            onClick={handleNavigation}
                        >
                            <FiCalendar className="inline mr-2" /> Events
                        </NavLink>
                        {id && (
                            <>
                                <NavLink
                                    to={`/event/${id}/meeting`}
                                    className="block px-3 py-2 rounded-md text-base font-medium text-white hover:bg-blue-600"
                                    onClick={handleNavigation}
                                >
                                    <FiUsers className="inline mr-2" /> Bookings
                                </NavLink>
                                <NavLink
                                    to={`/event/${id}/company`}
                                    className="block px-3 py-2 rounded-md text-base font-medium text-white hover:bg-blue-600"
                                    onClick={handleNavigation}
                                >
                                    <FiBriefcase className="inline mr-2" /> Companies
                                </NavLink>
                            </>
                        )}
                    </div>
                    <div className="pt-4 pb-3 border-t border-blue-800">
                        {isAuthenticated ? (
                            <>
                                <div className="flex items-center px-5">
                                    <div className="flex-shrink-0">
                                        <FiUser className="h-10 w-10 rounded-full bg-blue-600 p-2 text-white" />
                                    </div>
                                    <div className="ml-3">
                                        <div className="text-base font-medium text-white">
                                            {user?.username || 'User'}
                                        </div>
                                        <div className="text-sm font-medium text-blue-200">
                                            {user?.email}
                                        </div>
                                    </div>
                                </div>
                                <div className="mt-3 px-2 space-y-1">
                                    <Link
                                        to="/profile"
                                        className="block px-3 py-2 rounded-md text-base font-medium text-blue-200 hover:text-white hover:bg-blue-600"
                                        onClick={handleNavigation}
                                    >
                                        My Profile
                                    </Link>
                                    {user?.role === 'admin' && (
                                        <Link
                                            to="/signup"
                                            className="block px-3 py-2 rounded-md text-base font-medium text-blue-200 hover:text-white hover:bg-blue-600"
                                            onClick={handleNavigation}
                                        >
                                            Manage Users
                                        </Link>
                                    )}
                                    <button
                                        onClick={() => {
                                            logout();
                                            handleNavigation();
                                        }}
                                        className="block w-full text-left px-3 py-2 rounded-md text-base font-medium text-red-300 hover:text-white hover:bg-blue-600"
                                    >
                                        Sign out
                                    </button>
                                </div>
                            </>
                        ) : (
                            <button
                                onClick={() => {
                                    login();
                                    handleNavigation();
                                }}
                                className="w-full flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-base font-medium text-white bg-green-600 hover:bg-green-700"
                            >
                                Login
                            </button>
                        )}
                    </div>
                </div>
            )}
        </nav>
    );
};

export default Navbar;