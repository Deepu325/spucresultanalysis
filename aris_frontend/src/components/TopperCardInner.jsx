import React from 'react';
import { formatPercentageDisplay } from '../utils/formatPercentage';

/**
 * Shared body for TopCard (podium) and StudentCard (grid): rank, name, section,
 * percentage, optional Lang line, Subs line, footer.
 */
export default function TopperCardInner({ student, rank }) {
  const s1 = student.sub1 ?? '';
  const s2 = student.sub2 ?? '';
  const s3 = student.sub3 ?? '';
  const s4 = student.sub4 ?? '';

  const showLang =
    student.lan1 != null &&
    student.lan2 != null &&
    String(student.lan1).trim() !== '' &&
    String(student.lan2).trim() !== '';

  return (
    <>
      <div className="rank">#{rank}</div>

      <h2>{student.name}</h2>
      <p className="section">{student.section}</p>

      <div className="score">
        {formatPercentageDisplay(student.percentage)}
      </div>

      {showLang ? (
        <div className="marks">
          Lang: {student.lan1} | {student.lan2}
        </div>
      ) : null}
      <div className="marks">
        Subs: {s1 || '—'} | {s2 || '—'} | {s3 || '—'} | {s4 || '—'}
      </div>

      <div className="footer">
        <span>Total: {student.total != null ? student.total : '—'}</span>
        <span>{student.result_class}</span>
      </div>
    </>
  );
}
