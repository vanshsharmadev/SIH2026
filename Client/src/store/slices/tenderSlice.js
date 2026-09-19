import { createSlice } from '@reduxjs/toolkit';

const initialTenders = [];

const initialState = {
  items: initialTenders,
  searchTerm: '',
  selectedDepartment: 'All',
  selectedStatus: 'All',
  selectedCategory: 'All',
  activeTender: null,
  loading: false,
  error: null,
};

export const tenderSlice = createSlice({
  name: 'tenders',
  initialState,
  reducers: {
    setSearchTerm: (state, action) => {
      state.searchTerm = action.payload;
    },
    setDepartmentFilter: (state, action) => {
      state.selectedDepartment = action.payload;
    },
    setStatusFilter: (state, action) => {
      state.selectedStatus = action.payload;
    },
    setCategoryFilter: (state, action) => {
      state.selectedCategory = action.payload;
    },
    selectTender: (state, action) => {
      state.activeTender = action.payload;
    },
    addTender: (state, action) => {
      state.items.unshift(action.payload);
    },
    setTenders: (state, action) => {
      state.items = action.payload;
      state.loading = false;
    },
    resetFilters: (state) => {
      state.searchTerm = '';
      state.selectedDepartment = 'All';
      state.selectedStatus = 'All';
      state.selectedCategory = 'All';
    },
  },
});

export const {
  setSearchTerm,
  setDepartmentFilter,
  setStatusFilter,
  setCategoryFilter,
  selectTender,
  addTender,
  setTenders,
  resetFilters,
} = tenderSlice.actions;

export const selectAllTenders = (state) => state.tenders.items;
export const selectTenderFilters = (state) => ({
  searchTerm: state.tenders.searchTerm,
  department: state.tenders.selectedDepartment,
  status: state.tenders.selectedStatus,
  category: state.tenders.selectedCategory,
});
export const selectActiveTender = (state) => state.tenders.activeTender;

export default tenderSlice.reducer;
