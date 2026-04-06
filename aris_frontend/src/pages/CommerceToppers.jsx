import React from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import { getCommerceToppers } from '../services/api';
import { useFetch } from '../hooks/useFetch';
import TopCard from '../components/TopCard';
import StudentCard from '../components/StudentCard';
import { formatPercentageDisplay } from '../utils/formatPercentage';

const CommerceToppers = () => {
    const { refreshKey } = useOutletContext();
    const { data, loading, error } = useFetch(() => getCommerceToppers(), [refreshKey]);
    const navigate = useNavigate();

    if (loading) return <div className="loading">Loading Results...</div>;
    if (error) return <div className="error">{error}</div>;

    if (!data.length) {
        return (
            <div className="no-data">
                <p>No Commerce Toppers data available.</p>
                <button className="primary" onClick={() => navigate('/upload')}>
                    Upload Excel Now
                </button>
            </div>
        );
    }

    const topper = data[0];
    const top3 = data.slice(0, 3);
    const rest = data.slice(3);

    return (
        <div className="toppers-page">
            <div style={{ marginBottom: '32px', padding: '24px', background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)', borderRadius: '12px', color: 'white' }}>
                <h2 style={{ margin: 0, marginBottom: '8px', fontSize: '28px' }}>📊 Commerce Toppers</h2>
                <div style={{ fontSize: '14px', opacity: 0.9 }}>Commerce Stream Leaders</div>
            </div>

            {/* Top 3 Layout */}
            <div className="top3-row" style={{ padding: '24px', background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.05) 0%, rgba(220, 38, 38, 0.05) 100%)', borderRadius: '12px', marginBottom: '24px', border: '2px solid rgba(239, 68, 68, 0.1)' }}>
                {top3.length > 1 && <TopCard student={top3[1]} rank={2} />}
                {top3.length > 0 && <TopCard student={top3[0]} rank={1} big />}
                {top3.length > 2 && <TopCard student={top3[2]} rank={3} />}
            </div>

            {/* Rest Grid */}
            <div className="card-grid" style={{ padding: '20px', background: 'linear-gradient(135deg, rgba(254, 226, 226, 0.4) 0%, rgba(254, 243, 243, 0.4) 100%)', borderRadius: '12px', border: '1px solid rgba(239, 68, 68, 0.1)' }}>
                {rest.map((item, i) => (
                    <StudentCard key={item.name} student={item} rank={i + 4} />
                ))}
            </div>
        </div>
    );
};

export default CommerceToppers;