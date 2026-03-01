import axios from 'axios';

const BASE_URL = 'https://emr-feature.onrender.com';

const api = axios.create({ baseURL: BASE_URL });

// Dashboard
export const getDashboardSalesSummary = () => api.get('/api/dashboard/sales-summary');
export const getDashboardItemsSold = () => api.get('/api/dashboard/items-sold');
export const getDashboardLowStock = () => api.get('/api/dashboard/low-stock');
export const getDashboardPurchaseOrders = () => api.get('/api/dashboard/purchase-orders');
export const getRecentSales = (limit = 10) => api.get(`/api/dashboard/recent-sales?limit=${limit}`);

// Inventory
export const getInventoryOverview = () => api.get('/api/inventory/overview');
export const getMedicines = (params = {}) => api.get('/api/inventory/medicines', { params });
export const addMedicine = (data) => api.post('/api/inventory/medicines', data);
export const updateMedicine = (id, data) => api.put(`/api/inventory/medicines/${id}`, data);
export const updateMedicineStatus = (id, status) => api.patch(`/api/inventory/medicines/${id}/status?status=${encodeURIComponent(status)}`);
export const deleteMedicine = (id) => api.delete(`/api/inventory/medicines/${id}`);
