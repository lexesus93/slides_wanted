import React, { useState, useEffect } from 'react';
import { apiService } from '../services/api';

interface StatusItem {
  name: string;
  status: 'success' | 'warning' | 'error';
  details?: string;
}

const StatusChecker: React.FC = () => {
  const [statuses, setStatuses] = useState<StatusItem[]>([
    { name: 'Frontend', status: 'success', details: 'Running' },
    { name: 'Backend', status: 'warning', details: 'Checking...' },
    { name: 'AI API', status: 'warning', details: 'Checking...' },
  ]);

  useEffect(() => {
    checkStatuses();
  }, []);

  const checkStatuses = async () => {
    // Check Backend
    const backendResponse = await apiService.healthCheck();
    const backendStatus: StatusItem = {
      name: 'Backend',
      status: backendResponse.success ? 'success' : 'error',
      details: backendResponse.success ? 'Connected' : backendResponse.error || 'Failed',
    };

    // Check AI API
    const aiResponse = await apiService.aiHealthCheck();
    const aiStatus: StatusItem = {
      name: 'AI API', 
      status: aiResponse.success ? 'success' : 'error',
      details: aiResponse.success ? 'OpenRouter.ai Ready' : aiResponse.error || 'Failed',
    };

    setStatuses([
      { name: 'Frontend', status: 'success', details: 'Running' },
      backendStatus,
      aiStatus,
    ]);
  };

  return (
    <div className="status">
      {statuses.map((status, index) => (
        <div key={index} className="status-item">
          <span className={`status-indicator ${status.status}`}></span>
          {status.name}: {status.details}
        </div>
      ))}
    </div>
  );
};

export default StatusChecker;
