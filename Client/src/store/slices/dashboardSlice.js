import { createSlice } from '@reduxjs/toolkit';

const initialMetrics = {
  totalTenders: 128,
  totalTendersTrend: '+12%',
  submissionsReceived: 346,
  submissionsReceivedTrend: '+18%',
  evaluationsCompleted: 89,
  evaluationsCompletedTrend: '+15%',
  complianceIssues: 23,
  complianceIssuesTrend: '-5%',
};

const initialCompliance = {
  totalChecks: 346,
  compliant: 253,
  compliantPercentage: 73,
  minorIssues: 61,
  minorIssuesPercentage: 18,
  majorIssues: 32,
  majorIssuesPercentage: 9,
  complianceRate: 73,
  complianceRateTrend: '+8%',
  timeFilter: 'This Month',
};

const initialSubmissions = [
  {
    tenderId: 'GEM/2024/B/5123981',
    bidder: 'ABC Enterprises Pvt. Ltd.',
    submittedOn: '19 May 2024',
    score: 92,
    status: 'Compliant',
    statusColor: 'emerald',
  },
  {
    tenderId: 'GEM/2024/B/5123981',
    bidder: 'XYZ Solutions',
    submittedOn: '18 May 2024',
    score: 68,
    status: 'Minor Issues',
    statusColor: 'amber',
  },
  {
    tenderId: 'GEM/2024/B/5123981',
    bidder: 'Global Traders',
    submittedOn: '17 May 2024',
    score: 45,
    status: 'Major Issues',
    statusColor: 'rose',
  },
  {
    tenderId: 'GEM/2024/B/5123982',
    bidder: 'TechCorp India Pvt. Ltd.',
    submittedOn: '19 May 2024',
    score: 85,
    status: 'Compliant',
    statusColor: 'emerald',
  },
  {
    tenderId: 'GEM/2024/B/5123982',
    bidder: 'Innovative Supplies',
    submittedOn: '18 May 2024',
    score: 72,
    status: 'Minor Issues',
    statusColor: 'amber',
  },
];

const initialActivities = [
  {
    id: 1,
    type: 'completed',
    title: 'Compliance check completed',
    subtext: 'Tender ID: GEM/2024/B/5123981 | Bidder: ABC Enterprises Pvt. Ltd.',
    time: '10:30 AM',
    status: 'success',
  },
  {
    id: 2,
    type: 'warning',
    title: 'Minor issues detected',
    subtext: 'Tender ID: GEM/2024/B/5123981 | Bidder: XYZ Solutions',
    time: '09:45 AM',
    status: 'warning',
  },
  {
    id: 3,
    type: 'danger',
    title: 'Major compliance issues detected',
    subtext: 'Tender ID: GEM/2024/B/5123981 | Bidder: Global Traders',
    time: '09:15 AM',
    status: 'danger',
  },
  {
    id: 4,
    type: 'completed',
    title: 'Document verification completed',
    subtext: 'Tender ID: GEM/2024/B/5123982 | Bidder: TechCorp India Pvt. Ltd.',
    time: 'Yesterday',
    status: 'success',
  },
];

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
