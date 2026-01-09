import React, { createContext, useContext, useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as api from '../services/api';
import { useAuth } from './AuthContext';

const NotificationContext = createContext();

export const useNotifications = () => {
    return useContext(NotificationContext);
};

export const NotificationProvider = ({ children }) => {
    const queryClient = useQueryClient();
    const auth = useAuth();
    const token = auth?.token; // Safely access token even if auth is null
    const [unreadCount, setUnreadCount] = useState(0);

    // Fetch Notifications (Poll every 60s) - Only when authenticated
    const { data: notifications = [], isLoading } = useQuery({
        queryKey: ['notifications'],
        queryFn: () => api.getNotifications(false),
        refetchInterval: 60000,
        staleTime: 30000,
        enabled: !!token, // Only run query when user is authenticated
        retry: false, // Don't retry on auth failures
    });

    // Update unread count
    useEffect(() => {
        if (Array.isArray(notifications)) {
            setUnreadCount(notifications.filter(n => !n.is_read).length);
        }
    }, [notifications]);

    // Mutations
    const markReadMutation = useMutation({
        mutationFn: api.markNotificationRead,
        onSuccess: () => {
            queryClient.invalidateQueries(['notifications']);
        }
    });

    const markAllReadMutation = useMutation({
        mutationFn: api.markAllNotificationsRead,
        onSuccess: () => {
            queryClient.invalidateQueries(['notifications']);
        }
    });

    const deleteMutation = useMutation({
        mutationFn: api.deleteNotification,
        onSuccess: () => {
            queryClient.invalidateQueries(['notifications']);
        }
    });

    const value = {
        notifications,
        unreadCount,
        isLoading,
        markRead: markReadMutation.mutate,
        markAllRead: markAllReadMutation.mutate,
        deleteNotification: deleteMutation.mutate
    };

    return (
        <NotificationContext.Provider value={value}>
            {children}
        </NotificationContext.Provider>
    );
};
