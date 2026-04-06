import React from 'react';
import TopperCardInner from './TopperCardInner';

function TopCard({ student, rank, big }) {
  return (
    <div className={`top-card ${big ? 'big' : ''}`}>
      <TopperCardInner student={student} rank={rank} />
    </div>
  );
}

export default TopCard;
