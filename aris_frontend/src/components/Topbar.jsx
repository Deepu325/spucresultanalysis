import React from 'react';
import { useNavigate } from 'react-router-dom';
import html2pdf from 'html2pdf.js';

const Topbar = ({ setPresentationMode, statusData, onClear }) => {
  const navigate = useNavigate();

  const handleExportPDF = async () => {
    const element = document.querySelector('.content');
    
    if (!element) {
      alert('No content to export');
      return;
    }

    const opt = {
      margin: 10,
      filename: `ARIS-Report-${new Date().toLocaleDateString()}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2 },
      jsPDF: { orientation: 'portrait', unit: 'mm', format: 'a4' },
      pagebreak: { mode: ['avoid-all', 'css', 'legacy'] }
    };

    try {
      await html2pdf().set(opt).from(element).save();
    } catch (error) {
      console.error('Error exporting PDF:', error);
      alert('Error exporting PDF. Please try again.');
    }
  };

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
        <button onClick={handleExportPDF} style={{ backgroundColor: '#059669', borderColor: '#059669' }}>
          Export PDF
        </button>
      </div>
    </header>
  );
};

export default Topbar;
