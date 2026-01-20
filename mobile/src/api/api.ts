import axios from 'axios';
import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { API_BASE_URL } from '../constants/Config';

const api = axios.create({
    baseURL: API_BASE_URL,
});

// Request Interceptor - Add Auth Token
api.interceptors.request.use(
    async (config) => {
        let token;
        if (Platform.OS === 'web') {
            // Supabase stores the session in localStorage with a specific key pattern
            // or we can let the Supabase client handle it. But since we need raw axios...
            // For now, let's try getting it from where we stored it or Supabase default
            token = typeof localStorage !== 'undefined' ? localStorage.getItem('sb-access-token') : null;

            // Fallback: Try to get from Supabase session directly (best effort)
            if (!token) {
                const sbKey = Object.keys(localStorage).find(k => k.endsWith('auth-token'));
                if (sbKey) {
                    const session = JSON.parse(localStorage.getItem(sbKey) || '{}');
                    token = session.access_token;
                }
            }
        } else {
            token = await SecureStore.getItemAsync('sb-access-token');
        }

        if (token) {
            config.headers['Authorization'] = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// Response Interceptor
api.interceptors.response.use(
    (response) => response,
    async (error) => {
        if (error.response && error.response.status === 401) {
            console.warn("Session expired");
            // Supabase handles session, but we might want to trigger a logout action here
        }
        return Promise.reject(error);
    }
);

// --- API Methods (Ported from api.js) ---
export const getSettings = async () => (await api.get('/settings/user')).data;
export const updateSettings = async (settings: any) => (await api.put('/settings/user', settings)).data;
export const getBuckets = async () => (await api.get('/settings/buckets')).data;
export const getBucketsTree = async () => (await api.get('/settings/buckets/tree')).data;
export const getTags = async () => (await api.get('/settings/tags')).data;

// Analytics
export const getCalendarData = async (start: string, end: string) => (await api.get('/analytics/calendar', { params: { start_date: start, end_date: end } })).data;
export const getSubscriptions = async () => (await api.get('/analytics/subscriptions')).data;
export const getSuggestedSubscriptions = async () => (await api.get('/analytics/subscriptions/suggested')).data;
export const createSubscription = async (data: any) => (await api.post('/analytics/subscriptions', data)).data;
export const updateSubscription = async (id: string, data: any) => (await api.put(`/analytics/subscriptions/${id}`, data)).data;
export const deleteSubscription = async (id: string) => (await api.delete(`/analytics/subscriptions/${id}`)).data;
export const getDebtProjection = async (params: any) => (await api.get('/analytics/debt_projection', { params })).data;
export const getAnomalies = async () => (await api.get('/analytics/anomalies')).data;

// Goals
export const getGoals = async () => (await api.get('/goals/')).data;
export const createGoal = async (goal: any) => (await api.post('/goals/', goal)).data;
export const updateGoal = async (id: string, data: any) => (await api.put(`/goals/${id}`, data)).data;
export const deleteGoal = async (id: string) => (await api.delete(`/goals/${id}`)).data;

// Accounts
export const getAccounts = async () => (await api.get('/net-worth/accounts')).data;
export const createAccount = async (data: any) => (await api.post('/net-worth/accounts', data)).data;
export const updateAccount = async (id: string, data: any) => (await api.put(`/net-worth/accounts/${id}`, data)).data;
export const deleteAccount = async (id: string) => (await api.delete(`/net-worth/accounts/${id}`)).data;

// Members
export const getMembers = async () => (await api.get('/settings/members')).data;
export const createMember = async (memberData: any) => (await api.post('/settings/members', memberData)).data;
export const updateMember = async ({ id, data }: { id: string, data: any }) => (await api.put(`/settings/members/${id}`, data)).data;
export const deleteMember = async (id: string) => (await api.delete(`/settings/members/${id}`)).data;

// Buckets
export const createBucket = async (bucket: any) => (await api.post('/settings/buckets', bucket)).data;
export const updateBucket = async (id: string, bucket: any) => (await api.put(`/settings/buckets/${id}`, bucket)).data;
export const deleteBucket = async (id: string) => (await api.delete(`/settings/buckets/${id}`)).data;
export const reorderBuckets = async (orderData: any) => (await api.post('/settings/buckets/reorder', orderData)).data;

// Rules
export const getRules = async () => (await api.get('/settings/rules/')).data;
export const createRule = async (data: any) => (await api.post('/settings/rules/', data)).data;
export const updateRule = async (id: string, data: any) => (await api.put(`/settings/rules/${id}`, data)).data;
export const deleteRule = async (id: string) => (await api.delete(`/settings/rules/${id}`)).data;
export const bulkDeleteRules = async (ids: string[]) => (await api.post('/settings/rules/bulk-delete', ids)).data;

// Transactions
export const splitTransaction = async (id: string, items: any[]) => (await api.post(`/transactions/${id}/split`, { items })).data;
export const deleteAllTransactions = async () => (await api.delete('/transactions/all')).data;

// Holdings
export const getHoldings = async (accountId: string) => (await api.get(`/net-worth/accounts/${accountId}/holdings`)).data;
export const createHolding = async (accountId: string, holding: any) => (await api.post(`/net-worth/accounts/${accountId}/holdings`, holding)).data;
export const updateHolding = async (holdingId: string, holding: any) => (await api.put(`/net-worth/holdings/${holdingId}`, holding)).data;
export const deleteHolding = async (holdingId: string) => (await api.delete(`/net-worth/holdings/${holdingId}`)).data;
export const refreshHoldingPrices = async () => (await api.post(`/net-worth/holdings/refresh-prices`)).data;
export const getInvestmentHistory = async () => (await api.get('/investments/history')).data;

// Other
export const getCashFlowForecast = async (days = 90) => (await api.get('/analytics/forecast', { params: { days } })).data;
export const getUpcomingBills = async (days = 7) => (await api.get('/notifications/upcoming-bills', { params: { days } })).data;

export default api;
