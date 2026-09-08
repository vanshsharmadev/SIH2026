import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import tenderReducer from './slices/tenderSlice';
import dashboardReducer from './slices/dashboardSlice';
import uiReducer from './slices/uiSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    tenders: tenderReducer,
    dashboard: dashboardReducer,
    ui: uiReducer,
  },
  devTools: process.env.NODE_ENV !== 'production',
});

export default store;
