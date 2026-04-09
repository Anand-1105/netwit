import React from "react";
import { Route, Routes, Navigate } from "react-router-dom";

import HomeLayout from "./Layout/HomeLayout.jsx";
import Dashboard from "./Pages/Dashboard.jsx";
import Meeting from "./Pages/Meeting.jsx";
import Company from "./Pages/Company.jsx";
import SignIn from "./Pages/SignIn.jsx";
import SignUp from "./Pages/Signup.jsx";
import ProtectedLogin from "./protectedRoutes/ProtectedLogin.jsx";
import ProtectedAdmin from "./protectedRoutes/Admin.jsx";
import DefaultPage from "./Pages/DefaultPage.jsx";
import CreateEvent from "./Pages/CreateEvent.jsx";
import UpdateEvent from "./Pages/UpdateEvent.jsx";
import DashboardStats from "./Components/Dashboard/DashboardStats.jsx";
import Users from "./Pages/Users.jsx";
import LandingPage from "./Pages/LandingPage.jsx";

function App() {
  return (
    <Routes>
      {/* Landing page — public, no layout */}
      <Route path="/" element={<LandingPage />} />

      {/* Auth pages */}
      <Route path="/" element={<HomeLayout />}>
        <Route path="login" element={<SignIn />} />
        <Route path="signup" element={<SignUp />} />
      </Route>

      {/* Protected app routes */}
      <Route path="/app" element={<ProtectedLogin><HomeLayout /></ProtectedLogin>}>
        <Route index element={<DefaultPage />} />
        <Route path="event/:id" element={<Dashboard />} />
        <Route path="users" element={<Users />} />
        <Route path="event/update/:id" element={<UpdateEvent />} />
        <Route path="dashboard" element={<DashboardStats />} />
        <Route path="create" element={<CreateEvent />} />
        <Route path="event/:id/meeting" element={<Meeting />} />
        <Route path="event/:id/company" element={<Company />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;