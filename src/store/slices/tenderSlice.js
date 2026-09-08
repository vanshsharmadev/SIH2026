import { createSlice } from '@reduxjs/toolkit';

const initialTenders = [
  {
    id: 'GEM/2024/B/5123981',
    title: 'Supply of Office Stationery & Paper Supplies',
    department: 'Ministry of Education',
    lastDate: '25 May 2024',
    submissions: 8,
    status: 'Open',
    estimatedValue: '₹ 15,00,000',
    category: 'Goods',
  },
  {
    id: 'GEM/2024/B/5123982',
    title: 'IT Hardware Procurement & Networking Infrastructure',
    department: 'Ministry of Railways',
    lastDate: '28 May 2024',
    submissions: 12,
    status: 'Open',
    estimatedValue: '₹ 45,50,000',
    category: 'IT Hardware',
  },
  {
    id: 'GEM/2024/B/5123983',
    title: 'Road Construction Work & Highway Maintenance Phase 2',
    department: 'PWD Department',
    lastDate: '30 May 2024',
    submissions: 5,
    status: 'Open',
    estimatedValue: '₹ 2,80,00,000',
    category: 'Works',
  },
  {
    id: 'GEM/2024/B/5123984',
    title: 'Medical Equipment Supply for District Health Centers',
    department: 'Health Department',
    lastDate: '20 May 2024',
    submissions: 14,
    status: 'Closed',
    estimatedValue: '₹ 85,00,000',
    category: 'Healthcare',
  },
  {
    id: 'GEM/2024/B/5123985',
    title: 'Smart Classroom Setup & Interactive Display Units',
    department: 'Ministry of Education',
    lastDate: '18 May 2024',
    submissions: 9,
    status: 'Closed',
    estimatedValue: '₹ 62,00,000',
    category: 'Services',
  },
];

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
