import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { NotificationProvider } from '../context/NotificationContext';

export default function PrivateRoute({ children }) {
    const { token, loading } = useAuth();
    const location = useLocation();

    if (loading) {
        return <div className="p-10 text-center">Loading...</div>;
    }

    if (!token) {
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    // Wrap authenticated content with NotificationProvider
    return <NotificationProvider>{children}</NotificationProvider>;
}
