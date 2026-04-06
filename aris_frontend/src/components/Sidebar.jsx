import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';

const Sidebar = ({ onLogout }) => {
  const navigate = useNavigate();
  const userEmail = localStorage.getItem('userEmail');

  const handleLogout = () => {
    onLogout();
    navigate('/');
  };

  return (
    <div className="sidebar">
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: '20px',
        paddingBottom: '16px',
        borderBottom: '1px solid #1e293b'
      }}>
        <img
          src="/logo.jpeg"
          alt="logo"
          style={{
            maxWidth: '200px',
            maxHeight: '200px',
            objectFit: 'contain'
          }}
        />
      </div>
      <h2 style={{ color: '#ffffff', textAlign: 'center' }}>ARIS</h2>
      <nav>
        <ul>
          <li><NavLink to="/college-toppers" className={({ active }) => active ? 'active' : ''}>College Toppers</NavLink></li>
          <li><NavLink to="/science-toppers" className={({ active }) => active ? 'active' : ''}>Science Toppers</NavLink></li>
          <li><NavLink to="/commerce-toppers" className={({ active }) => active ? 'active' : ''}>Commerce Toppers</NavLink></li>
          <li><NavLink to="/section-toppers" className={({ active }) => active ? 'active' : ''}>Section Toppers</NavLink></li>
          <li><NavLink to="/sections" className={({ active }) => active ? 'active' : ''}>Section Performance</NavLink></li>
          <li><NavLink to="/heatmap" className={({ active }) => active ? 'active' : ''}>Section & Subject Analysis</NavLink></li>
          <li><NavLink to="/subjects" className={({ active }) => active ? 'active' : ''}>Subject-wise Performance Analysis</NavLink></li>
          <li style={{ marginTop: 'auto', borderTop: '1px solid #1e293b', paddingTop: '16px' }}>
            <NavLink to="/upload" className={({ active }) => active ? 'active' : ''}>📤 Upload Results</NavLink>
          </li>
          {userEmail && (
            <li style={{
              marginTop: '12px',
              borderTop: '1px solid #1e293b',
              paddingTop: '12px',
              display: 'flex',
              flexDirection: 'column',
              gap: '8px',
              alignItems: 'flex-start'
            }}>
              <span style={{
                fontSize: '12px',
                color: '#94a3b8',
                paddingLeft: '8px',
                wordBreak: 'break-all'
              }}>
                {userEmail}
              </span>
              <button 
                onClick={handleLogout}
                style={{
                  width: '100%',
                  padding: '8px 12px',
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
            </li>
          )}
        </ul>
      </nav>
      <div style={{
        marginTop: 'auto',
        paddingTop: '20px',
        borderTop: '1px solid #1e293b',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center'
      }}>
        <img
          src="/watermarklogo.png"
          alt="watermark"
          style={{
            maxWidth: '120px',
            maxHeight: '120px',
            objectFit: 'contain'
          }}
        />
      </div>
    </div>
  );
};

export default Sidebar;
