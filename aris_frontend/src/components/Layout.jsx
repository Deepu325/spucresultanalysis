import React from 'react';
import Sidebar from './Sidebar';
import Topbar from './Topbar';
import { Outlet, useLocation } from 'react-router-dom';

const Layout = ({ presentationMode, setPresentationMode, statusData, refreshKey, onLogout, onClear }) => {
    const location = useLocation();

    return (
        <div className="layout">
            {!presentationMode && <Sidebar onLogout={onLogout} />}
            <div className="main-wrapper">
                {!presentationMode && (
                    <Topbar 
                        setPresentationMode={setPresentationMode}
                        statusData={statusData}
                        onClear={onClear}
                    />
                )}
                <main className="content" key={location.pathname}>
                    <Outlet context={{ statusData, refreshKey }} />
                </main>
            </div>
        </div>
    );
};

export default Layout;
