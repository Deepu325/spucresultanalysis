import React, { useState } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import { getSubjects } from '../services/api';
import { useFetch } from '../hooks/useFetch';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell, Legend, PieChart, Pie, LineChart, Line } from 'recharts';

const Subjects = () => {
    const { refreshKey } = useOutletContext();
    const { data, loading, error } = useFetch(() => getSubjects(), [refreshKey]);
    const navigate = useNavigate();
    const [selectedSubject, setSelectedSubject] = useState(null);

    if (loading) return <div className="loading">Loading Results...</div>;
    if (error) return <div className="error">{error}</div>;

    if (!data.length) return (
        <div className="no-data">
            <p>No Subject Performance data available.</p>
            <button className="primary" onClick={() => navigate('/upload')}>
                Upload Excel Now
            </button>
        </div>
    );

    // Debug: log the actual data structure
    if (data.length > 0) {
        console.log('First item:', data[0]);
    }
    
    // Group subjects by name (remove SCI/COM/TOT variants if they exist)
    const uniqueSubjectsMap = {};
    data.forEach(item => {
        let subjectName = item.subject;
        
        // If subject is just a variant name (SCI, COM, TOT), skip it - these should be grouped
        // under their parent subject in the variants object
        if (['SCI', 'SCIENCE', 'COM', 'COMMERCE', 'TOT', 'TOTAL'].includes(subjectName?.toUpperCase?.())) {
            return;
        }
        
        // Remove variant suffix like _SCI, _COM, _TOT from the subject name
        subjectName = subjectName?.replace(/_(SCI|SCIENCE|COM|COMMERCE|TOT|TOTAL)$/i, '') || '';
        
        // If we haven't seen this subject, or if this entry has variants (prefer aggregated data)
        if (subjectName) {
            if (!uniqueSubjectsMap[subjectName]) {
                uniqueSubjectsMap[subjectName] = item;
            } else {
                // Prefer entries with variants or with pass_percentage defined
                const existing = uniqueSubjectsMap[subjectName];
                if ((item.variants && !existing.variants) || (item.pass_percentage && !existing.pass_percentage)) {
                    uniqueSubjectsMap[subjectName] = item;
                }
            }
        }
    });
    
    const uniqueSubjects = Object.values(uniqueSubjectsMap);
    
    // If deduplication resulted in variant-only data, show them grouped
    if (uniqueSubjects.length === 0 && data.length > 0) {
        // Fallback: group by first 2-3 characters or show all unique subjects
        data.forEach(item => {
            if (!uniqueSubjectsMap[item.subject]) {
                uniqueSubjectsMap[item.subject] = item;
            }
        });
    }
    
    const finalSubjects = Object.values(uniqueSubjectsMap).length > 0 ? Object.values(uniqueSubjectsMap) : data;
    
    // Initialize selected subject
    if (!selectedSubject && finalSubjects.length > 0) {
        setSelectedSubject(finalSubjects[0].subject);
    }

    // Get selected subject data
    const current = finalSubjects.find(s => s.subject === selectedSubject) || finalSubjects[0];
    
    // Extract metrics (with fallback from variants.total if top-level not available)
    const getMetric = (key) => {
        if (current[key] !== undefined && current[key] !== null) return current[key];
        if (current.variants?.total?.[key] !== undefined) return current.variants.total[key];
        return 0;
    };
    
    const enrolled = getMetric('enrolled');
    const appeared = getMetric('appeared');
    const discontinued = getMetric('discontinued');
    const distinction = getMetric('distinction');
    const first_class = getMetric('first_class');
    const second_class = getMetric('second_class');
    const pass_class = getMetric('pass_class');
    const detained = getMetric('detained');
    const promoted = getMetric('promoted');
    const centums = getMetric('centums');
    const pass_percentage = getMetric('pass_percentage');

    // Grade distribution for chart
    const gradeDistribution = [
        { name: 'DISTINCTION', value: distinction, color: '#059669' },
        { name: 'I CLASS', value: first_class, color: '#2563eb' },
        { name: 'II CLASS', value: second_class, color: '#d97706' },
        { name: 'PASS CLASS', value: pass_class, color: '#8b5cf6' }
    ].filter(g => g.value > 0);

    // Prepare comparison data if variants exist
    const hasVariants = current.variants && Object.keys(current.variants).length > 1;
    const comparisonData = hasVariants ? Object.entries(current.variants).map(([key, values]) => ({
        name: key.toUpperCase(),
        enrolled: values.enrolled || 0,
        distinction: values.distinction || 0,
        first_class: values.first_class || 0,
        pass_percentage: ((values.pass_percentage || 0) * 100)
    })) : null;

    const maxPassPct = Math.max(...finalSubjects.map(d => d.pass_percentage || 0));
    const minPassPct = Math.min(...finalSubjects.map(d => d.pass_percentage || 0));

    return (
        <div style={{ padding: '20px' }}>
            <h2 style={{ marginBottom: '24px', color: '#1e293b' }}>Subject-wise Performance Analysis</h2>

            {/* Subject Filter */}
            <div style={{ marginBottom: '24px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', fontSize: '14px' }}>
                    Select Subject:
                </label>
                <select
                    value={selectedSubject || ''}
                    onChange={(e) => setSelectedSubject(e.target.value)}
                    style={{
                        padding: '10px 12px',
                        borderRadius: '6px',
                        border: '1px solid #ddd',
                        fontSize: '14px',
                        width: '100%',
                        maxWidth: '400px',
                        cursor: 'pointer',
                        fontWeight: '500'
                    }}
                >
                    {finalSubjects.map(subject => (
                        <option key={subject.subject} value={subject.subject}>
                            {subject.subject}
                        </option>
                    ))}
                </select>
            </div>

            {/* Performance Overview with Metrics */}
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '20px', marginBottom: '24px', alignItems: 'start' }}>
                {/* Grade Distribution Pie Chart */}
                {gradeDistribution.length > 0 && (
                    <div style={{
                        backgroundColor: '#f8fafc',
                        borderRadius: '8px',
                        padding: '20px',
                        border: '1px solid #e2e8f0'
                    }}>
                        <h3 style={{ marginTop: 0, marginBottom: '16px', color: '#1e293b', fontSize: '16px' }}>Grade Distribution - {current.subject}</h3>
                        <div style={{ width: '100%', height: 300 }}>
                            <ResponsiveContainer>
                                <PieChart>
                                    <Pie
                                        data={gradeDistribution}
                                        cx="50%"
                                        cy="50%"
                                        labelLine={true}
                                        label={({ name, value }) => `${name}: ${value}`}
                                        outerRadius={100}
                                        fill="#8884d8"
                                        dataKey="value"
                                    >
                                        {gradeDistribution.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.color} />
                                        ))}
                                    </Pie>
                                    <Tooltip />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                )}

                {/* Key Metrics Grid - Right Side */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px' }}>
                    <MetricCard label="Total Enrolled" value={enrolled} color="#0369a1" bgColor="#f0f9ff" borderColor="#bae6fd" />
                    <MetricCard label="Appeared" value={appeared} color="#d97706" bgColor="#fef3c7" borderColor="#fcd34d" />
                    <MetricCard label="Discontinued" value={discontinued} color="#dc2626" bgColor="#fee2e2" borderColor="#fecaca" />
                    <MetricCard label="Distinction" value={distinction} color="#059669" bgColor="#dcfce7" borderColor="#86efac" />
                    <MetricCard label="I Class" value={first_class} color="#2563eb" bgColor="#dbeafe" borderColor="#93c5fd" />
                    <MetricCard label="II Class" value={second_class} color="#f59e0b" bgColor="#fef3c7" borderColor="#fde68a" />
                    <MetricCard label="Pass Class" value={pass_class} color="#8b5cf6" bgColor="#f3e8ff" borderColor="#e9d5ff" />
                    <MetricCard label="Detained" value={detained} color="#64748b" bgColor="#f1f5f9" borderColor="#cbd5e1" />
                    <MetricCard label="Promoted" value={promoted} color="#059669" bgColor="#ecfdf5" borderColor="#a7f3d0" />
                    <MetricCard label="Centums" value={centums} color="#7c3aed" bgColor="#f5f3ff" borderColor="#e9d5ff" />
                    <MetricCard label="Pass %" value={`${((pass_percentage || 0) * 100).toFixed(2)}%`} color="#4f46e5" bgColor="#e0e7ff" borderColor="#c7d2fe" />
                </div>
            </div>

            {/* SCI vs COM Comparison (if variants exist) */}
            {hasVariants && comparisonData && (
                <div style={{
                    backgroundColor: '#f8fafc',
                    borderRadius: '8px',
                    padding: '20px',
                    marginBottom: '24px',
                    border: '1px solid #e2e8f0'
                }}>
                    <h3 style={{ marginTop: 0, marginBottom: '16px', color: '#1e293b' }}>Science vs Commerce Comparison</h3>
                    <div style={{ width: '100%', height: 300 }}>
                        <ResponsiveContainer>
                            <BarChart data={comparisonData}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                <XAxis dataKey="name" />
                                <YAxis />
                                <Tooltip 
                                    contentStyle={{ backgroundColor: '#fff', border: '1px solid #ccc', borderRadius: '4px' }}
                                    formatter={(value, name) => 
                                        name === 'Pass %' ? `${value.toFixed(2)}%` : value.toLocaleString()
                                    }
                                />
                                <Legend />
                                <Bar dataKey="enrolled" fill="#3b82f6" name="Enrolled" />
                                <Bar dataKey="distinction" fill="#059669" name="Distinction" />
                                <Bar dataKey="first_class" fill="#f59e0b" name="I Class" />
                                <Bar dataKey="pass_percentage" fill="#8b5cf6" name="Pass %" />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            )}



            {/* Detailed Subject Comparison Table */}
            <div style={{
                backgroundColor: '#f8fafc',
                borderRadius: '8px',
                padding: '20px',
                border: '1px solid #e2e8f0',
                overflowX: 'auto'
            }}>
                <h3 style={{ marginTop: 0, marginBottom: '16px', color: '#1e293b' }}>All Subjects Comparison</h3>
                <table style={{
                    borderCollapse: 'collapse',
                    width: '100%',
                    minWidth: '900px',
                    fontSize: '13px'
                }}>
                    <thead>
                        <tr style={{ backgroundColor: '#e2e8f0', borderBottom: '2px solid #1e293b' }}>
                            <th style={{ padding: '12px', color: '#1e293b', textAlign: 'left', fontWeight: '600' }}>Subject</th>
                            <th style={{ padding: '12px', color: '#1e293b', textAlign: 'center', fontWeight: '600' }}>Enrolled</th>
                            <th style={{ padding: '12px', color: '#1e293b', textAlign: 'center', fontWeight: '600' }}>Appeared</th>
                            <th style={{ padding: '12px', color: '#1e293b', textAlign: 'center', fontWeight: '600' }}>Distinction</th>
                            <th style={{ padding: '12px', color: '#1e293b', textAlign: 'center', fontWeight: '600' }}>I Class</th>
                            <th style={{ padding: '12px', color: '#1e293b', textAlign: 'center', fontWeight: '600' }}>II Class</th>
                            <th style={{ padding: '12px', color: '#1e293b', textAlign: 'center', fontWeight: '600' }}>Pass %</th>
                            <th style={{ padding: '12px', color: '#1e293b', textAlign: 'center', fontWeight: '600' }}>Promoted</th>
                        </tr>
                    </thead>
                    <tbody>
                        {finalSubjects.map((subject, idx) => (
                            <tr key={subject.subject} style={{
                                backgroundColor: selectedSubject === subject.subject ? '#dbeafe' : (idx % 2 === 0 ? '#fff' : '#f8fafc'),
                                cursor: 'pointer',
                                transition: 'background-color 0.2s'
                            }} onClick={() => setSelectedSubject(subject.subject)}>
                                <td style={{ padding: '12px', fontWeight: '600', color: '#1e293b' }}>{subject.subject}</td>
                                <td style={{ padding: '12px', textAlign: 'center' }}>{subject.enrolled || 0}</td>
                                <td style={{ padding: '12px', textAlign: 'center' }}>{subject.appeared || 0}</td>
                                <td style={{ padding: '12px', textAlign: 'center', color: '#059669', fontWeight: '500' }}>{subject.distinction || 0}</td>
                                <td style={{ padding: '12px', textAlign: 'center', color: '#2563eb', fontWeight: '500' }}>{subject.first_class || 0}</td>
                                <td style={{ padding: '12px', textAlign: 'center', color: '#f59e0b', fontWeight: '500' }}>{subject.second_class || 0}</td>
                                <td style={{ 
                                    padding: '12px', 
                                    textAlign: 'center', 
                                    fontWeight: '700',
                                    color: (subject.pass_percentage || 0) === maxPassPct ? '#059669' : (subject.pass_percentage || 0) === minPassPct ? '#dc2626' : '#1e293b'
                                }}>
                                    {((subject.pass_percentage || 0) * 100).toFixed(2)}%
                                </td>
                                <td style={{ padding: '12px', textAlign: 'center' }}>{subject.promoted || 0}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

// Reusable Metric Card Component
const MetricCard = ({ label, value, color, bgColor, borderColor }) => (
    <div style={{
        backgroundColor: bgColor,
        padding: '16px',
        borderRadius: '8px',
        textAlign: 'center',
        border: `1px solid ${borderColor}`,
        transition: 'transform 0.2s'
    }}>
        <div style={{ fontSize: '11px', color: color, fontWeight: '600', marginBottom: '6px', textTransform: 'uppercase' }}>
            {label}
        </div>
        <div style={{ fontSize: '26px', fontWeight: '700', color: color }}>
            {value}
        </div>
    </div>
);

export default Subjects;
