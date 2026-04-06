import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import {
  getSectionToppersGrouped,
  getSectionToppersTop10,
} from '../services/api';
import { formatPercentageDisplay } from '../utils/formatPercentage';
import TopperCardInner from '../components/TopperCardInner';

function SectionCard({ student }) {
  return (
    <div className="section-card">
      <h3>{student.section}</h3>
      <div className="score">{formatPercentageDisplay(student.percentage)}</div>
      <p className="name">{student.name}</p>
      <div className="meta">
        <span>{student.result_class || '—'}</span>
        <span>
          Total: {student.total != null ? student.total : '—'}
        </span>
      </div>
    </div>
  );
}

function SectionDetailedStudentCard({ student, rank }) {
  return (
    <div className="student-card">
      <TopperCardInner student={student} rank={rank} />
    </div>
  );
}

const SectionToppers = () => {
  const { refreshKey } = useOutletContext();
  const navigate = useNavigate();
  const [mode, setMode] = useState('summary');
  const [data, setData] = useState(null);
  const [sectionFilter, setSectionFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    const fetcher =
      mode === 'summary' ? getSectionToppersGrouped : getSectionToppersTop10;
    fetcher()
      .then((payload) => {
        if (!cancelled) {
          setData(payload);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err?.message || 'Failed to load section toppers');
          setLoading(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [mode, refreshKey]);

  const sectionOptions = useMemo(() => {
    if (!data || mode !== 'detailed' || Array.isArray(data)) return [];
    return Object.keys(data).sort((a, b) => a.localeCompare(b));
  }, [data, mode]);

  const detailedEntries = useMemo(() => {
    if (!data || mode !== 'detailed' || Array.isArray(data)) return [];
    let entries = Object.entries(data);
    if (sectionFilter) {
      entries = entries.filter(([section]) => section === sectionFilter);
    }
    return entries;
  }, [data, mode, sectionFilter]);

  useEffect(() => {
    if (mode === 'summary') {
      setSectionFilter('');
    }
  }, [mode]);

  if (loading) {
    return <div className="loading">Loading Results...</div>;
  }
  if (error) {
    return <div className="error">{error}</div>;
  }

  const summaryEmpty =
    mode === 'summary' && (!Array.isArray(data) || data.length === 0);
  const detailedEmpty =
    mode === 'detailed' &&
    (!data ||
      typeof data !== 'object' ||
      Array.isArray(data) ||
      Object.keys(data).length === 0);

  if (summaryEmpty || detailedEmpty) {
    return (
      <div className="no-data">
        <p>No Section-wise Toppers data available.</p>
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

  const topper = mode === 'summary' && Array.isArray(data) ? data[0] : null;

  return (
    <div className="toppers-page section-toppers-page">
      <div style={{ marginBottom: '32px', padding: '24px', background: 'linear-gradient(135deg, #06b6d4 0%, #0891b2 100%)', borderRadius: '12px', color: 'white' }}>
        <h2 style={{ margin: 0, marginBottom: '8px', fontSize: '28px' }}>📍 Section Toppers</h2>
        <div style={{ fontSize: '14px', opacity: 0.9 }}>Section-wise Performance Leaders</div>
      </div>

      <div className="topbar-controls" style={{ marginBottom: '24px' }}>
        {mode === 'detailed' ? (
          <select
            className="section-filter-select"
            value={sectionFilter}
            onChange={(e) => setSectionFilter(e.target.value)}
            aria-label="Filter by section"
          >
            <option value="">All Sections</option>
            {sectionOptions.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        ) : (
          <span className="topbar-controls-spacer" aria-hidden="true" />
        )}

        <div className="mode-toggle">
          <button
            type="button"
            className={mode === 'summary' ? 'mode-active' : ''}
            onClick={() => setMode('summary')}
          >
            Summary
          </button>
          <button
            type="button"
            className={mode === 'detailed' ? 'mode-active' : ''}
            onClick={() => setMode('detailed')}
          >
            Detailed
          </button>
        </div>
      </div>

      {mode === 'summary' && Array.isArray(data) && (
        <>
          {topper ? (
            <div style={{ marginBottom: '32px', padding: '20px', background: 'linear-gradient(135deg, #e0f2fe 0%, #cffafe 100%)', borderRadius: '12px', color: '#0c4a6e', border: '2px solid rgba(6, 182, 212, 0.2)' }}>
              <span style={{ fontSize: '12px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px', opacity: 0.8 }}>Top Section</span>
              <div style={{ fontSize: '24px', fontWeight: '700', margin: '8px 0' }}>{topper.section}</div>
              <div style={{ fontSize: '16px', fontWeight: '600' }}>{formatPercentageDisplay(topper.percentage)} Pass %</div>
            </div>
          ) : null}

          <div className="card-grid section-toppers-summary-grid" style={{ padding: '20px', background: 'linear-gradient(135deg, rgba(6, 182, 212, 0.05) 0%, rgba(165, 243, 252, 0.05) 100%)', borderRadius: '12px', border: '1px solid rgba(6, 182, 212, 0.1)' }}>
            {data.map((item) => (
              <SectionCard
                key={`${item.section}-${item.name}`}
                student={item}
              />
            ))}
          </div>
        </>
      )}

      {mode === 'detailed' && !Array.isArray(data) && (
        <div className="section-toppers-detailed" style={{ padding: '20px', background: 'linear-gradient(135deg, rgba(6, 182, 212, 0.03) 0%, rgba(165, 243, 252, 0.03) 100%)', borderRadius: '12px' }}>
          {detailedEntries.map(([section, students]) => (
            <div key={section} className="section-group" style={{ marginBottom: '24px', padding: '20px', background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.8) 0%, rgba(240, 253, 250, 0.8) 100%)', borderRadius: '12px', border: '2px solid rgba(6, 182, 212, 0.15)' }}>
              <h3 style={{ marginTop: 0, padding: '12px 16px', background: 'linear-gradient(135deg, #06b6d4 0%, #0891b2 100%)', color: 'white', borderRadius: '8px', marginBottom: '16px' }}>{section}</h3>
              <div className="card-grid">
                {students.map((student, i) => (
                  <SectionDetailedStudentCard
                    key={`${section}-${student.name}-${i}`}
                    student={student}
                    rank={i + 1}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default SectionToppers;
