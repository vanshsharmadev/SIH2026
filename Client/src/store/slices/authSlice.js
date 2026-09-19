import { createSlice } from '@reduxjs/toolkit';

const getInitialAuth = () => {
  try {
    const token = localStorage.getItem('token') || null;
    const savedUser = localStorage.getItem('user');
    const user = savedUser ? JSON.parse(savedUser) : null;
    return {
      user: token ? user : null,
      token,
      isAuthenticated: Boolean(token),
      loading: false,
      error: null,
    };
  } catch (err) {
    console.error('Failed to load auth from localStorage', err);
    return {
      user: null,
      token: null,
      isAuthenticated: false,
      loading: false,
      error: null,
    };
  }
};

const initialState = getInitialAuth();

export const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    loginStart: (state) => {
      state.loading = true;
      state.error = null;
    },
    loginSuccess: (state, action) => {
      const { user, token } = action.payload;
      state.user = user;
      state.token = token;
      state.isAuthenticated = true;
      state.loading = false;
      state.error = null;
      try {
        localStorage.setItem('user', JSON.stringify(user));
        localStorage.setItem('token', token);
      } catch (err) {
        console.error('Failed to write to localStorage', err);
      }
    },
    loginFailure: (state, action) => {
      state.loading = false;
      state.error = action.payload || 'Login failed';
    },
    logout: (state) => {
      state.user = null;
      state.token = null;
      state.isAuthenticated = false;
      state.loading = false;
      state.error = null;
      try {
        localStorage.removeItem('user');
        localStorage.removeItem('token');
      } catch (err) {
        console.error('Failed to clear auth from localStorage', err);
      }
    },
    updateUser: (state, action) => {
      state.user = { ...state.user, ...action.payload };
      try {
        localStorage.setItem('user', JSON.stringify(state.user));
      } catch (err) {
        console.error('Failed to update user in localStorage', err);
      }
    },
    clearError: (state) => {
      state.error = null;
    },
  },
});

export const {
  loginStart,
  loginSuccess,
  loginFailure,
  logout,
  updateUser,
  clearError,
} = authSlice.actions;

export const selectAuth = (state) => state.auth;
export const selectCurrentUser = (state) => state.auth.user;
export const selectIsAuthenticated = (state) => state.auth.isAuthenticated;

export default authSlice.reducer;
