import React from 'react';
import { useNavigate } from 'react-router-dom';
import OfficerUploadExtractView from '../Dashboard/OfficerUploadExtractView';

const UploadExtract = () => {
  const navigate = useNavigate();

  return (
    <div className="w-full max-w-7xl mx-auto py-4 px-3 sm:px-6 space-y-6">
      <OfficerUploadExtractView
        onBackToDashboard={() => navigate('/dashboard')}
        onOpenCompliance={() => navigate('/dashboard?tab=compliance')}
        onOpenSubmissions={() => navigate('/dashboard?tab=submissions')}
        onOpenTopBidders={() => navigate('/dashboard?tab=top-bidders')}
      />
    </div>
  );
};

export default UploadExtract;
