import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  sidebarOpen: false,
  notificationsCount: 5,
  activeModal: null,
  activeTab: 'dashboard',
};

export const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    toggleSidebar: (state) => {
      state.sidebarOpen = !state.sidebarOpen;
    },
    setSidebarOpen: (state, action) => {
      state.sidebarOpen = Boolean(action.payload);
    },
    openModal: (state, action) => {
      state.activeModal = action.payload;
    },
    closeModal: (state) => {
      state.activeModal = null;
    },
    setActiveTab: (state, action) => {
      state.activeTab = action.payload;
    },
    decrementNotification: (state) => {
      if (state.notificationsCount > 0) {
        state.notificationsCount -= 1;
      }
    },
    resetNotifications: (state) => {
      state.notificationsCount = 0;
    },
  },
});

export const {
  toggleSidebar,
  setSidebarOpen,
  openModal,
  closeModal,
  setActiveTab,
  decrementNotification,
  resetNotifications,
} = uiSlice.actions;

export const selectSidebarOpen = (state) => state.ui.sidebarOpen;
export const selectActiveModal = (state) => state.ui.activeModal;
export const selectNotificationsCount = (state) => state.ui.notificationsCount;
export const selectActiveTab = (state) => state.ui.activeTab;

export default uiSlice.reducer;
