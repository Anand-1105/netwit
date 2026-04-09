import React, { useContext } from "react";
import { UserContext } from "../Context/UserContext";
import { Navigate } from "react-router-dom";
import Loader from "../Components/Loader";

const ProtectedAdmin = ({ children }) => {
    const { user, isAuthenticated, loading } = useContext(UserContext);
    if (loading) return <Loader />;
    if (!isAuthenticated) return <Navigate to="/login" replace />;
    if (user.role !== 'admin') return <Navigate to="/" replace />;
    return children;
};

export default ProtectedAdmin;