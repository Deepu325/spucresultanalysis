import React, { useState } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import { getHeatmap } from '../services/api';
import { useFetch } from '../hooks/useFetch';

const Heatmap = () => {
    const { refreshKey } = useOutletContext();
    const { data, loading, error } = useFetch(() => getHeatmap(), [refreshKey]);
    const navigate = useNavigate();
    const [selectedSection, setSelectedSection] = useState(null);

    if (loading) return <div className="loading">Loading Results...</div>;
    if (error) return <div className="error">{error}</div>;

    if (!data.length) return (
        <div className="no-data">
            <p>No Heatmap data available.</p>
            <button className="primary" onClick={() => navigate('/upload')}>
                Upload Excel Now
            </button>
        </div>
    );

    // Group data by section (trim to handle whitespace) - define FIRST before using
    const sections = [...new Set(data.map(item => item.section).filter(s => s))];

    // Initialize selected section
    if (!selectedSection && sections.length > 0) {
        setSelectedSection(sections[0].trim());
    }

    const getHeatmapColor = (value) => {
        // For grade distribution heatmap - red, yellow, green scale
        if (value === 0) return '#f5f5f5'; // Light gray for 0
        if (value <= 5) return '#fecaca'; // Light red
        if (value <= 10) return '#fcd34d'; // Yellow
        if (value <= 20) return '#86efac'; // Light green
        if (value <= 30) return '#22c55e'; // Green
        return '#15803d'; // Dark green
    };

    // Get data for selected section (with trim comparison)
    const selectedSectionData = data.filter(item => {
        return item.section && item.section.trim() === (selectedSection ? selectedSection.trim() : selectedSection);
    });
    
    // Grade distribution columns
    const gradeColumns = ['distinction', 'first_class', 'second_class', 'third_class', 'centums', 'fail', 'discontinued'];
    const gradeLabels = ['DISTINCTION', 'I CLASS', 'II CLASS', 'III CLASS', 'CENTUMS', 'FAIL', 'DISCONTINUED'];

    return (
        <div style={{ padding: '20px' }}>
            <h2 style={{ marginBottom: '24px', color: '#1e293b' }}>Section & Subject Analysis</h2>

            {/* Section Filter */}
            <div style={{ marginBottom: '24px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
                    Select Section:
                </label>
                <select
                    value={selectedSection || ''}
                    onChange={(e) => setSelectedSection(e.target.value)}
                    style={{
                        padding: '8px 12px',
                        borderRadius: '4px',
                        border: '1px solid rgb(221, 221, 221)',
                        fontSize: '14px',
                        cursor: 'pointer',
                        minWidth: '250px',
                    }}
                >
                    <optgroup label="Individual Sections">
                        {sections.filter(s => !['SCIENCE TOTAL', 'COMMERCETOTAL', 'GRAND TOTAL'].includes(s)).map(section => (
                            <option key={section} value={section}>
                                {section}
                            </option>
                        ))}
                    </optgroup>
                    <optgroup label="Totals">
                        {sections.filter(s => ['SCIENCE TOTAL', 'COMMERCETOTAL', 'GRAND TOTAL'].includes(s)).map(section => (
                            <option key={section} value={section}>
                                {section}
                            </option>
                        ))}
                    </optgroup>
                </select>
            </div>

            {/* Grade Distribution Heatmap */}
            {selectedSection && selectedSectionData.length > 0 && (
            <div style={{
                backgroundColor: '#f8fafc',
                borderRadius: '8px',
                padding: '20px',
                border: '1px solid #e2e8f0',
                overflowX: 'auto',
                marginBottom: '24px'
            }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                    <h3 style={{ marginBottom: '0', color: '#1e293b' }}>Grade Distribution - {selectedSection}</h3>
                    <div style={{
                        backgroundColor: '#3b82f6',
                        color: '#fff',
                        padding: '12px 20px',
                        borderRadius: '8px',
                        fontWeight: '700',
                        fontSize: '16px',
                        textAlign: 'center',
                        minWidth: '150px'
                    }}>
                        <div style={{ fontSize: '12px', fontWeight: '500', opacity: 0.9 }}>Total Students</div>
                        <div>{selectedSectionData.length > 0 ? selectedSectionData[0].total : 0}</div>
                    </div>
                </div>
                <table style={{
                    borderCollapse: 'collapse',
                    width: '100%',
                    minWidth: '900px',
                }}>
                    <thead>
                        <tr>
                            <th style={{
                                padding: '12px',
                                backgroundColor: '#1e293b',
                                color: '#fff',
                                fontWeight: '600',
                                textAlign: 'left',
                                minWidth: '120px'
                            }}>Subject</th>
                            {gradeLabels.map(label => (
                                <th key={label} style={{
                                    padding: '12px',
                                    backgroundColor: '#1e293b',
                                    color: '#fff',
                                    fontWeight: '600',
                                    textAlign: 'center',
                                    minWidth: '100px',
                                    fontSize: '12px'
                                }}>
                                    {label}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {selectedSectionData.map((item, rowIndex) => (
                            <tr key={item.subject} style={{
                                backgroundColor: rowIndex % 2 === 0 ? '#fff' : '#f8fafc'
                            }}>
                                <td style={{
                                    padding: '12px',
                                    fontWeight: '600',
                                    color: '#1e293b',
                                    borderRight: '2px solid #e2e8f0'
                                }}>
                                    {item.subject}
                                </td>
                                {gradeColumns.map(col => {
                                    const value = item[col] || 0;
                                    return (
                                        <td key={`${item.subject}-${col}`} style={{
                                            padding: '12px',
                                            textAlign: 'center',
                                            backgroundColor: getHeatmapColor(value),
                                            fontWeight: '600',
                                            color: value > 10 ? '#fff' : '#1e293b',
                                            borderRight: '1px solid #e2e8f0'
                                        }}>
                                            {value}
                                        </td>
                                    );
                                })}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            )}

            {/* Color Legend */}
            <div style={{
                backgroundColor: '#f8fafc',
                borderRadius: '8px',
                padding: '20px',
                border: '1px solid #e2e8f0'
            }}>
                <h4 style={{ marginBottom: '12px', color: '#1e293b' }}>Grade Distribution Legend</h4>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div style={{ width: '24px', height: '24px', backgroundColor: '#f5f5f5', borderRadius: '4px', border: '1px solid #ddd' }}></div>
                        <span>0 (No students)</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div style={{ width: '24px', height: '24px', backgroundColor: '#fecaca', borderRadius: '4px' }}></div>
                        <span>1-5 (Few students)</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div style={{ width: '24px', height: '24px', backgroundColor: '#fcd34d', borderRadius: '4px' }}></div>
                        <span>6-10 (Some students)</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div style={{ width: '24px', height: '24px', backgroundColor: '#86efac', borderRadius: '4px' }}></div>
                        <span>11-20 (Moderate)</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div style={{ width: '24px', height: '24px', backgroundColor: '#22c55e', borderRadius: '4px' }}></div>
                        <span>21-30 (Many students)</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div style={{ width: '24px', height: '24px', backgroundColor: '#15803d', borderRadius: '4px' }}></div>
                        <span>30+ (Most students)</span>
                    </div>
                </div>
            </div>

        </div>
    );
};

export default Heatmap;
