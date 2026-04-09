import React from 'react';
import Sidebar from '../Components/Sidebar';
import { Outlet, useLocation } from 'react-router';
import { useContext } from 'react';
import { UserContext } from '../Context/UserContext';

const HomeLayout = () => {
    const { isAuthenticated } = useContext(UserContext);
    const location = useLocation();
    const isAuthPage = location.pathname === '/login' || location.pathname === '/signup';
    const isLanding = location.pathname === '/';

    if (!isAuthenticated || isAuthPage || isLanding) {
        return <Outlet />;
    }

    return (
        <div className="flex min-h-screen bg-[#0f0f0f]">
            <Sidebar />
            <main className="flex-1 min-w-0 overflow-auto" style={{ marginLeft: 'var(--sidebar-width)' }}>
                <Outlet />
            </main>
        </div>
    );
};

export default HomeLayout;
