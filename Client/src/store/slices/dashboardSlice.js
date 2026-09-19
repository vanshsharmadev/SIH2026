import { createSlice } from '@reduxjs/toolkit';

const initialMetrics = {
  totalTenders: 0,
  totalTendersTrend: '0%',
  submissionsReceived: 0,
  submissionsReceivedTrend: '0%',
  evaluationsCompleted: 0,
  evaluationsCompletedTrend: '0%',
  complianceIssues: 0,
  complianceIssuesTrend: '0%',
};

const initialCompliance = {
  totalChecks: 0,
  compliant: 0,
  compliantPercentage: 0,
  minorIssues: 0,
  minorIssuesPercentage: 0,
  majorIssues: 0,
  majorIssuesPercentage: 0,
  complianceRate: 0,
  complianceRateTrend: '0%',
  timeFilter: 'This Month',
};

const initialSubmissions = [];

const initialActivities = [];

const initialState = {
  metrics: initialMetrics,
  compliance: initialCompliance,
  recentSubmissions: initialSubmissions,
  activities: initialActivities,
  loading: false,
};

export const dashboardSlice = createSlice({
  name: 'dashboard',
  initialState,
  reducers: {
    updateMetrics: (state, action) => {
      state.metrics = { ...state.metrics, ...action.payload };
    },
    setTimeFilter: (state, action) => {
      state.compliance.timeFilter = action.payload;
    },
    updateComplianceOverview: (state, action) => {
      state.compliance = { ...state.compliance, ...action.payload };
    },
    addSubmission: (state, action) => {
      state.recentSubmissions.unshift(action.payload);
      state.metrics.submissionsReceived += 1;
    },
    addActivity: (state, action) => {
      state.activities.unshift({
        id: Date.now(),
        time: 'Just now',
        ...action.payload,
      });
    },
  },
});

export const {
  updateMetrics,
  setTimeFilter,
  updateComplianceOverview,
  addSubmission,
  addActivity,
} = dashboardSlice.actions;

export const selectDashboardMetrics = (state) => state.dashboard.metrics;
export const selectComplianceOverview = (state) => state.dashboard.compliance;
export const selectRecentSubmissions = (state) => state.dashboard.recentSubmissions;
export const selectDashboardActivities = (state) => state.dashboard.activities;

export default dashboardSlice.reducer;
