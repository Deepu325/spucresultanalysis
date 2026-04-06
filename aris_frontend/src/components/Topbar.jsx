import React from 'react';
import { useNavigate } from 'react-router-dom';

const Topbar = ({ setPresentationMode, statusData, onClear }) => {
  const navigate = useNavigate();

  return (
    <header className="topbar">
      <div className="topbar-left">
        <h1>ARIS Dashboard</h1>
        {statusData?.last_updated && (
          <div className="trust-signals">
            Last updated: {statusData.last_updated} • File: {statusData.filename}
          </div>
        )}
      </div>
      <div className="actions">
        <button className="primary" onClick={() => setPresentationMode(true)}>
          Presentation Mode
        </button>
        <button onClick={() => navigate('/upload')}>
          Upload Excel
        </button>
        <button onClick={onClear} style={{ backgroundColor: '#f97316', borderColor: '#f97316' }}>
          Clear Results
        </button>
        <button disabled>Export PDF</button>
      </div>
    </header>
  );
};

export default Topbar;
