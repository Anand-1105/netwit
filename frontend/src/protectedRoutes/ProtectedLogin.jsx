import React, { useContext } from "react";
import { UserContext } from "../Context/UserContext";
import { Navigate } from "react-router-dom";
import Loader from "../Components/Loader";

const ProtectedLogin = ({ children }) => {
    const { user, isAuthenticated, loading } = useContext(UserContext);
    if (loading) return <Loader />;
    if (!isAuthenticated || !user) return <Navigate to="/login" replace />;
    return children;
};

export default ProtectedLogin;