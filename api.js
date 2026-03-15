// ============================================================
// FILE 16: frontend/src/services/api.js
// الاتصال بالسيرفر - كل الـ API calls
// ============================================================

import AsyncStorage from '@react-native-async-storage/async-storage';

// ⚠️ غيّر هذا الرابط برابط سيرفرك على Render
const BASE_URL = 'https://YOUR-APP-NAME.onrender.com/api';

class ApiService {

  async getToken() {
    return await AsyncStorage.getItem('auth_token');
  }

  async request(endpoint, method = 'GET', body = null) {
    const token = await this.getToken();

    const headers = {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    };

    const config = { method, headers };
    if (body) config.body = JSON.stringify(body);

    try {
      const response = await fetch(`${BASE_URL}${endpoint}`, config);
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Request failed');
      return data;
    } catch (error) {
      console.error(`API Error [${method} ${endpoint}]:`, error.message);
      throw error;
    }
  }

  // ==================== AUTH ====================
  auth = {
    register:      (data)          => this.request('/auth/register', 'POST', data),
    login:         (email, pass)   => this.request('/auth/login', 'POST', { email, password: pass }),
    me:            ()              => this.request('/auth/me'),
    updateProfile: (data)          => this.request('/auth/update-profile', 'PUT', data),
    changePassword:(old_p, new_p)  => this.request('/auth/change-password', 'PUT', { old_password: old_p, new_password: new_p }),
  };

  // ==================== PRODUCTS ====================
  products = {
    list:     (params = {})  => this.request(`/products?${new URLSearchParams(params)}`),
    get:      (id)           => this.request(`/products/${id}`),
    create:   (data)         => this.request('/products', 'POST', data),
    update:   (id, data)     => this.request(`/products/${id}`, 'PUT', data),
    delete:   (id)           => this.request(`/products/${id}`, 'DELETE'),
    review:   (id, data)     => this.request(`/products/${id}/review`, 'POST', data),
    wishlist: (id)           => this.request(`/products/${id}/wishlist`, 'POST'),
    search:   (q)            => this.request(`/products?search=${encodeURIComponent(q)}`),
    featured: ()             => this.request('/products?featured=true&limit=10'),
    byCategory: (cid, p={}) => this.request(`/products?category=${cid}&${new URLSearchParams(p)}`),
  };

  // ==================== ORDERS ====================
  orders = {
    create:        (data)        => this.request('/orders', 'POST', data),
    myOrders:      (params = {}) => this.request(`/orders?${new URLSearchParams(params)}`),
    merchantOrders:(params = {}) => this.request(`/orders/merchant?${new URLSearchParams(params)}`),
    get:           (id)          => this.request(`/orders/${id}`),
    updateStatus:  (id, status, tracking) =>
                     this.request(`/orders/${id}/status`, 'PUT', { status, tracking_number: tracking }),
    cancel:        (id)          => this.request(`/orders/${id}/cancel`, 'PUT'),
  };

  // ==================== MERCHANTS ====================
  merchants = {
    register:      (data)        => this.request('/merchants/register', 'POST', data),
    myStore:       ()            => this.request('/merchants/my-store'),
    update:        (data)        => this.request('/merchants/update', 'PUT', data),
    dashboard:     ()            => this.request('/merchants/dashboard/stats'),
    get:           (id)          => this.request(`/merchants/${id}`),
    list:          (params = {}) => this.request(`/merchants?${new URLSearchParams(params)}`),
    notifications: ()            => this.request('/merchants/my/notifications'),
    readAllNotifs: ()            => this.request('/merchants/notifications/read-all', 'PUT'),
  };

  // ==================== REPORTS ====================
  reports = {
    daily:   (date)         => this.request(`/reports/daily${date ? '?date=' + date : ''}`),
    monthly: (year, month)  => this.request(`/reports/monthly?year=${year}&month=${month}`),
    admin:   ()             => this.request('/reports/admin'),
  };

  // ==================== ADS ====================
  ads = {
    list:  (position) => this.request(`/ads${position ? '?position=' + position : ''}`),
    click: (id)       => this.request(`/ads/click/${id}`, 'POST'),
    create:(data)     => this.request('/ads', 'POST', data),
  };

  // ==================== UPLOAD ====================
  upload = {
    image:    (base64, folder = 'products') => this.request('/upload/image', 'POST', { base64, folder }),
    multiple: (images, folder = 'products') => this.request('/upload/multiple', 'POST', { images, folder }),
    video:    (base64)                       => this.request('/upload/video', 'POST', { base64 }),
    avatar:   (base64)                       => this.request('/upload/avatar', 'POST', { base64 }),
  };

  // ==================== CATEGORIES ====================
  categories = {
    list:  ()   => this.request('/categories'),
    get:   (id) => this.request(`/categories/${id}`),
  };
}

export default new ApiService();
