import React from 'react';
import { useNavigate } from 'react-router-dom';

const Footer = ({ onLogout }) => {
  const navigate = useNavigate();
  const userEmail = localStorage.getItem('userEmail');

  const handleLogout = () => {
    onLogout();
    navigate('/');
  };

  if (!userEmail) return null;

  return (
    <footer style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'flex-end',
      gap: '12px',
      padding: '12px 20px',
      borderTop: '1px solid #e2e8f0',
      backgroundColor: '#f8fafc',
      position: 'fixed',
      bottom: 0,
      right: 0,
      left: 'auto',
      width: 'auto',
      zIndex: 1000
    }}>
      <span style={{ fontSize: '13px', color: '#64748b' }}>
        {userEmail}
      </span>
      <button 
        onClick={handleLogout}
        style={{
          padding: '6px 12px',
          backgroundColor: '#dc2626',
          color: '#fff',
          border: 'none',
          borderRadius: '4px',
          fontSize: '12px',
          fontWeight: '500',
          cursor: 'pointer',
          transition: 'background-color 0.2s'
        }}
        onMouseEnter={(e) => e.target.style.backgroundColor = '#b91c1c'}
        onMouseLeave={(e) => e.target.style.backgroundColor = '#dc2626'}
      >
        Logout
      </button>
    </footer>
  );
};

export default Footer;
