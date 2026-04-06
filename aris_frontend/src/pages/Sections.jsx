import React, { useState, useEffect } from 'react';
import { useNavigate, useOutletContext, useLocation } from 'react-router-dom';
import { getSections } from '../services/api';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';

/** API may return 0.92 or 92 — display uses 0–100 scale. */
function toPctNumber(v) {
  const n = Number(v);
  if (!Number.isFinite(n)) return 0;
  return n > 0 && n < 1 ? n * 100 : n;
}

const KPI = ({ title, value }) => (
  <div className="kpi-card">
    <div className="kpi-title">{title}</div>
    <div className="kpi-value">{value}</div>
  </div>
);

const COLORS = ['#059669', '#2563eb', '#f59e0b', '#ef4444'];

const Sections = () => {
  const outlet = useOutletContext() ?? {};
  const refreshKey = outlet.refreshKey ?? 0;
  const location = useLocation();
  const navigate = useNavigate();
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedSection, setSelectedSection] = useState(null);

  useEffect(() => {
    setLoading(true);
    getSections()
      .then((res) => {
        const list = Array.isArray(res) ? res : [];
        const mapped = list.map((s) => ({
          ...s,
          enrolled: s.enrolled != null ? Number(s.enrolled) : undefined,
          pass_percentage: toPctNumber(s.pass_percentage),
          distinction_percentage: toPctNumber(s.distinction_percentage ?? 0),
        }));

        if (mapped.some((s) => s.passed === 0)) {
          console.error('Invalid data: passed cannot be 0');
        }

        mapped.sort(
          (a, b) => (b.pass_percentage ?? 0) - (a.pass_percentage ?? 0)
        );
        setData(mapped);
        // Set first individual section as default
        const firstIndividual = mapped.find(
          (s) => !s.section.toUpperCase().includes('TOTAL') && !s.section.toUpperCase().includes('GRAND')
        );
        setSelectedSection(firstIndividual?.section || mapped[0]?.section || null);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, [refreshKey, location.pathname]);

  if (loading) return <div className="loading">Loading Results...</div>;
  if (error) return <div className="error">{error}</div>;
  if (!data.length) {
    return (
      <div className="no-data">
        <p>No Section Performance data available.</p>
        <button
          type="button"
          className="primary"
          onClick={() => navigate('/upload')}
        >
          Upload Excel Now
        </button>
      </div>
    );
  }

  const totalAppeared = data.reduce((sum, s) => sum + (s.appeared || 0), 0);
  const totalPromoted = data.reduce((sum, s) => sum + (s.passed || 0), 0);
  const hasEnrolled = data.some((s) => s.enrolled != null);
  const totalEnrolledSum = hasEnrolled
    ? data.reduce((sum, s) => sum + (s.enrolled ?? 0), 0)
    : totalAppeared;
  const passPercentageWeighted =
    totalAppeared > 0
      ? Math.round((totalPromoted / totalAppeared) * 100)
      : 0;

  // Filter out total/summary sections for grade distribution
  const individualSections = data.filter(
    (s) =>
      !s.section.toUpperCase().includes('TOTAL') &&
      !s.section.toUpperCase().includes('GRAND')
  );

  // Recalculate KPIs using only individual sections (not totals)
  const kpiTotalAppeared = individualSections.reduce((sum, s) => sum + (s.appeared || 0), 0);
  const kpiTotalPromoted = individualSections.reduce((sum, s) => sum + (s.passed || 0), 0);
  const kpiHasEnrolled = individualSections.some((s) => s.enrolled != null);
  const kpiTotalEnrolledSum = kpiHasEnrolled
    ? individualSections.reduce((sum, s) => sum + (s.enrolled ?? 0), 0)
    : kpiTotalAppeared;
  const kpiPassPercentageWeighted =
    kpiTotalAppeared > 0
      ? Math.round((kpiTotalPromoted / kpiTotalAppeared) * 100)
      : 0;

  const totalDistinction = individualSections.reduce(
    (sum, s) => sum + (s.distinction || 0),
    0
  );
  const totalFirstClass = individualSections.reduce(
    (sum, s) => sum + (s.first_class || 0),
    0
  );
  const totalSecondClass = individualSections.reduce(
    (sum, s) => sum + (s.second_class || 0),
    0
  );
  const totalPassClass = individualSections.reduce(
    (sum, s) => sum + (s.pass_class || 0),
    0
  );

  const pieData = [
    { name: 'Distinction', value: totalDistinction },
    { name: 'First Class', value: totalFirstClass },
    { name: 'Second Class', value: totalSecondClass },
    { name: 'Pass Class', value: totalPassClass },
  ].filter((d) => d.value > 0);

  const barData = individualSections
    .map((s) => ({
      section: s.section,
      appeared: Number(s.appeared) || 0,
      passed: Number(s.passed) || 0,
    }))
    .filter((s) => s.appeared > 0 || s.passed > 0);

  const scienceSections = individualSections.filter((s) =>
    s.section.toUpperCase().includes('PC')
  );
  const scienceAvg = scienceSections.length
    ? Math.round(
        scienceSections.reduce((sum, s) => sum + s.pass_percentage, 0) /
          scienceSections.length
      )
    : null;

  const commerceSections = individualSections.filter(
    (s) =>
      s.section.toUpperCase().includes('CEBA') ||
      s.section.toUpperCase().includes('MEBA')
  );
  const commerceAvg = commerceSections.length
    ? Math.round(
        commerceSections.reduce((sum, s) => sum + s.pass_percentage, 0) /
          commerceSections.length
      )
    : null;

  const topSection = individualSections[0] || data[0];

  return (
    <div className="sections-page">
      <h2>Section Performance</h2>

      <div className="kpi-row kpi-row--primary">
        <KPI
          title="Total Students Enrolled"
          value={String(kpiTotalEnrolledSum)}
        />
        <KPI title="Total Appeared" value={String(kpiTotalAppeared)} />
        <KPI title="No of Students Promoted" value={String(kpiTotalPromoted)} />
        <KPI title="Pass Percentage" value={`${kpiPassPercentageWeighted}%`} />
      </div>

      <div className="kpi-row kpi-row--secondary">
        <KPI
          title="Science Pass %"
          value={scienceAvg != null ? `${scienceAvg}%` : '—'}
        />
        <KPI
          title="Commerce Pass %"
          value={commerceAvg != null ? `${commerceAvg}%` : '—'}
        />
        <KPI
          title="Top Section"
          value={`${topSection.section} (${Math.round(topSection.pass_percentage)}%)`}
        />
      </div>

      <div className="chart-toggle">
        <button className="active">Distinction %</button>
      </div>

      <div className="sections-chart" style={{ backgroundColor: '#f8fafc', borderRadius: '8px', padding: '20px', border: '1px solid #e2e8f0' }}>
        <h3 style={{ marginBottom: '16px', color: '#1e293b' }}>Distinction % by Section</h3>
        <ResponsiveContainer width="100%" height={400}>
          <BarChart
            data={individualSections}
            margin={{ top: 20, right: 30, left: 30, bottom: 80 }}
          >
            <defs>
              <linearGradient id="colorGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#2563eb" stopOpacity={0.9}/>
                <stop offset="95%" stopColor="#1e40af" stopOpacity={0.7}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" horizontal={true} vertical={false} />
            <XAxis 
              dataKey="section" 
              angle={-45}
              textAnchor="end"
              height={100}
              interval={0}
              tick={{ fontSize: 12, fill: '#475569' }}
            />
            <YAxis 
              domain={[0, 100]} 
              label={{ value: 'Percentage (%)', angle: -90, position: 'insideLeft' }}
              tick={{ fontSize: 12, fill: '#475569' }}
            />
            <Tooltip
              formatter={(value) => `${Math.round(value)}%`}
              contentStyle={{ 
                borderRadius: 8, 
                border: 'none', 
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
                backgroundColor: '#fff',
                padding: '12px'
              }}
              cursor={{ fill: 'rgba(37, 99, 235, 0.1)' }}
            />
            <Bar
              dataKey="distinction_percentage"
              fill="url(#colorGradient)"
              radius={[8, 8, 0, 0]}
              barSize={40}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="secondary-charts" style={{ gridColumn: '1 / -1' }}>
        <div className="chart-box" style={{ gridColumn: '1 / -1' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h4>Grade Distribution</h4>
            <select
              value={selectedSection || ''}
              onChange={(e) => setSelectedSection(e.target.value)}
              style={{
                padding: '8px 12px',
                borderRadius: '4px',
                border: '1px solid #ddd',
                fontSize: '14px',
                cursor: 'pointer',
                minWidth: '250px',
              }}
            >
              <optgroup label="Individual Sections">
                {(() => {
                  const sectionOrder = [
                    "PCMB 'A'",
                    "PCMB 'B'",
                    "PCMB/ PCMC/ PCME 'C'",
                    "PCMB 'D'",
                    "PCMC 'F'",
                    "PCME 'E'",
                    "I CEBA G1",
                    "I CEBA G2",
                    "I CEBA/ CSBA G3",
                    "I SEBA G4",
                    "I PEBA G6",
                    "I MSBA/ MEBA G5",
                  ];
                  const individual = data.filter(
                    (s) =>
                      !s.section.toUpperCase().includes('TOTAL') &&
                      !s.section.toUpperCase().includes('GRAND')
                  );
                  const sorted = sectionOrder
                    .map((order) => individual.find((s) => s.section === order))
                    .filter(Boolean);
                  return sorted.map((section) => (
                    <option key={section.section} value={section.section}>
                      {section.section}
                    </option>
                  ));
                })()}
              </optgroup>
              <optgroup label="Totals">
                {(() => {
                  const totalOrder = ["SCIENCE TOTAL", "COMMERCETOTAL", "GRAND TOTAL"];
                  const totals = data.filter(
                    (s) =>
                      s.section.toUpperCase().includes('SCIENCE TOTAL') ||
                      s.section.toUpperCase().includes('COMMERCETOTAL') ||
                      s.section.toUpperCase().includes('GRAND TOTAL')
                  );
                  const sorted = totalOrder
                    .map((order) =>
                      totals.find((s) => s.section.toUpperCase() === order)
                    )
                    .filter(Boolean);
                  return sorted.map((section) => (
                    <option key={section.section} value={section.section}>
                      {section.section}
                    </option>
                  ));
                })()}
              </optgroup>
            </select>
          </div>
          <div style={{ display: 'flex', gap: '24px' }}>
            <ResponsiveContainer width="70%" height={550}>
              <PieChart>
                <Pie
                  data={
                    selectedSection
                      ? (() => {
                          const selected = data.find((s) => s.section === selectedSection);
                          if (!selected) return [];
                          return [
                            { name: 'Distinction', value: selected.distinction || 0 },
                            { name: 'First Class', value: selected.first_class || 0 },
                            { name: 'Second Class', value: selected.second_class || 0 },
                            { name: 'Pass Class', value: selected.pass_class || 0 },
                          ].filter((d) => d.value > 0);
                        })()
                      : pieData
                  }
                  dataKey="value"
                  nameKey="name"
                  outerRadius={120}
                  label={({ name, percent }) =>
                    `${name} ${(percent * 100).toFixed(0)}%`
                  }
                >
                  {(selectedSection
                    ? (() => {
                        const selected = data.find((s) => s.section === selectedSection);
                        if (!selected) return [];
                        return [
                          { name: 'Distinction', value: selected.distinction || 0 },
                          { name: 'First Class', value: selected.first_class || 0 },
                          { name: 'Second Class', value: selected.second_class || 0 },
                          { name: 'Pass Class', value: selected.pass_class || 0 },
                        ].filter((d) => d.value > 0);
                      })()
                    : pieData
                  ).map((entry, index) => (
                    <Cell key={index} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>

            {selectedSection && (() => {
              const selected = data.find((s) => s.section === selectedSection);
              if (!selected) return null;
              
              return (
                <div
                  style={{
                    width: '40%',
                    padding: '24px',
                    backgroundColor: '#f8fafc',
                    borderRadius: '8px',
                    border: '1px solid #e2e8f0',
                    overflowY: 'auto',
                  }}
                >
                  <h4 style={{ marginBottom: '20px', color: '#1e293b', fontSize: '14px', fontWeight: '600' }}>
                    Section Statistics
                  </h4>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
                    <tbody>
                      <tr style={{ borderBottom: '1px solid #e2e8f0', backgroundColor: '#fff' }}>
                        <td style={{ padding: '12px 0', fontWeight: '500', color: '#475569', textAlign: 'left' }}>Total Students Enrolled</td>
                        <td style={{ padding: '12px 0', textAlign: 'center', fontWeight: '700', color: '#1e293b', fontSize: '15px' }}>
                          {selected.enrolled || selected.appeared}
                        </td>
                      </tr>
                      <tr style={{ borderBottom: '1px solid #e2e8f0', backgroundColor: '#f8fafc' }}>
                        <td style={{ padding: '12px 0', fontWeight: '500', color: '#475569', textAlign: 'left' }}>Discontinued/Absent</td>
                        <td style={{ padding: '12px 0', textAlign: 'center', fontWeight: '700', color: '#64748b', fontSize: '15px' }}>
                          {(selected.enrolled || selected.appeared) - selected.appeared}
                        </td>
                      </tr>
                      <tr style={{ borderBottom: '1px solid #e2e8f0', backgroundColor: '#fff' }}>
                        <td style={{ padding: '12px 0', fontWeight: '500', color: '#475569', textAlign: 'left' }}>Total Appeared</td>
                        <td style={{ padding: '12px 0', textAlign: 'center', fontWeight: '700', color: '#1e293b', fontSize: '15px' }}>
                          {selected.appeared}
                        </td>
                      </tr>
                      <tr style={{ borderBottom: '1px solid #dbeafe', backgroundColor: '#ecfdf5', borderLeft: '4px solid #10b981' }}>
                        <td style={{ padding: '12px 0 12px 8px', fontWeight: '600', color: '#047857', textAlign: 'left' }}>Distinction</td>
                        <td style={{ padding: '12px 0', textAlign: 'center', fontWeight: '700', color: '#047857', fontSize: '15px' }}>
                          {selected.distinction || 0}
                        </td>
                      </tr>
                      <tr style={{ borderBottom: '1px solid #e2e8f0', backgroundColor: '#f8fafc' }}>
                        <td style={{ padding: '12px 0', fontWeight: '500', color: '#475569', textAlign: 'left' }}>First Class</td>
                        <td style={{ padding: '12px 0', textAlign: 'center', fontWeight: '700', color: '#1e293b', fontSize: '15px' }}>
                          {selected.first_class || 0}
                        </td>
                      </tr>
                      <tr style={{ borderBottom: '1px solid #e2e8f0', backgroundColor: '#fff' }}>
                        <td style={{ padding: '12px 0', fontWeight: '500', color: '#475569', textAlign: 'left' }}>Second Class</td>
                        <td style={{ padding: '12px 0', textAlign: 'center', fontWeight: '700', color: '#1e293b', fontSize: '15px' }}>
                          {selected.second_class || 0}
                        </td>
                      </tr>
                      <tr style={{ borderBottom: '1px solid #e2e8f0', backgroundColor: '#f8fafc' }}>
                        <td style={{ padding: '12px 0', fontWeight: '500', color: '#475569', textAlign: 'left' }}>Pass Class</td>
                        <td style={{ padding: '12px 0', textAlign: 'center', fontWeight: '700', color: '#1e293b', fontSize: '15px' }}>
                          {selected.pass_class || 0}
                        </td>
                      </tr>
                      <tr style={{ borderBottom: '1px solid #e2e8f0', backgroundColor: '#fff' }}>
                        <td style={{ padding: '12px 0', fontWeight: '500', color: '#475569', textAlign: 'left' }}>Detained</td>
                        <td style={{ padding: '12px 0', textAlign: 'center', fontWeight: '700', color: '#1e293b', fontSize: '15px' }}>
                          {selected.detained || 0}
                        </td>
                      </tr>
                      <tr style={{ borderBottom: '1px solid #dbeafe', backgroundColor: '#f0f9ff', borderLeft: '4px solid #0ea5e9' }}>
                        <td style={{ padding: '12px 0 12px 8px', fontWeight: '600', color: '#0369a1', textAlign: 'left' }}>No of Students Promoted</td>
                        <td style={{ padding: '12px 0', textAlign: 'center', fontWeight: '700', color: '#0369a1', fontSize: '15px' }}>
                          {selected.passed}
                        </td>
                      </tr>
                      <tr style={{ backgroundColor: '#fef3c7', borderLeft: '4px solid #f59e0b' }}>
                        <td style={{ padding: '12px 0 12px 8px', fontWeight: '600', color: '#92400e', textAlign: 'left' }}>Pass Percentage</td>
                        <td style={{ padding: '12px 0', textAlign: 'center', fontWeight: '700', color: '#92400e', fontSize: '16px' }}>
                          {Math.round(selected.pass_percentage)}%
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              );
            })()}
          </div>
        </div>

        <div className="chart-box" style={{ gridColumn: '1 / -1' }}>
          <h4 style={{ marginBottom: '16px', color: '#1e293b' }}>Appeared vs Passed by Section</h4>
          <ResponsiveContainer width="100%" height={350}>
            <BarChart 
              data={individualSections}
              margin={{ top: 20, right: 30, left: 30, bottom: 80 }}
            >
              <defs>
                <linearGradient id="appearedGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#94a3b8" stopOpacity={0.9}/>
                  <stop offset="95%" stopColor="#64748b" stopOpacity={0.7}/>
                </linearGradient>
                <linearGradient id="passedGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.9}/>
                  <stop offset="95%" stopColor="#059669" stopOpacity={0.7}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" horizontal={true} vertical={false} />
              <XAxis 
                dataKey="section"
                angle={-45}
                textAnchor="end"
                height={100}
                interval={0}
                tick={{ fontSize: 12, fill: '#475569' }}
              />
              <YAxis 
                label={{ value: 'Number of Students', angle: -90, position: 'insideLeft' }}
                tick={{ fontSize: 12, fill: '#475569' }}
              />
              <Tooltip
                contentStyle={{ 
                  borderRadius: 8, 
                  border: 'none', 
                  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
                  backgroundColor: '#fff',
                  padding: '12px'
                }}
                cursor={{ fill: 'rgba(37, 99, 235, 0.1)' }}
              />
              <Bar dataKey="appeared" fill="url(#appearedGradient)" name="Appeared" radius={[8, 8, 0, 0]} barSize={40} />
              <Bar dataKey="passed" fill="url(#passedGradient)" name="Passed" radius={[8, 8, 0, 0]} barSize={40} />
              <Legend wrapperStyle={{ paddingTop: '16px' }} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <p className="insight sections-insight">
        <strong>{topSection.section}</strong> leads with{' '}
        <strong>{Math.round(topSection.pass_percentage)}%</strong> pass rate.
      </p>

      <table className="sections-table">
        <thead>
          <tr>
            <th>Section</th>
            <th>Appeared</th>
            <th>Passed</th>
            <th>Pass %</th>
            <th>Distinction %</th>
          </tr>
        </thead>
        <tbody>
          {(() => {
            const sectionOrder = [
              "PCMB 'A'",
              "PCMB 'B'",
              "PCMB/ PCMC/ PCME 'C'",
              "PCMB 'D'",
              "PCMC 'F'",
              "PCME 'E'",
              "I CEBA G1",
              "I CEBA G2",
              "I CEBA/ CSBA G3",
              "I SEBA G4",
              "I PEBA G6",
              "I MSBA/ MEBA G5",
              "SCIENCE TOTAL",
              "COMMERCETOTAL",
              "GRAND TOTAL",
            ];
            const sorted = sectionOrder
              .map((order) => data.find((s) => s.section === order))
              .filter(Boolean);
            return sorted.map((row) => (
              <tr key={row.section}>
                <td>{row.section}</td>
                <td>{row.appeared}</td>
                <td>{row.passed}</td>
                <td>{Math.round(row.pass_percentage)}%</td>
                <td>{Math.round(row.distinction_percentage ?? 0)}%</td>
              </tr>
            ));
          })()}
        </tbody>
      </table>
    </div>
  );
};

export default Sections;