import React from 'react';
import TopperCardInner from './TopperCardInner';

export default function StudentCard({ student, rank }) {
  return (
    <div className="top-card top-card--grid">
      <TopperCardInner student={student} rank={rank} />
    </div>
  );
}
