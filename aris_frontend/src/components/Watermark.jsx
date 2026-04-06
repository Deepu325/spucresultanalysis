import React from 'react';

const Watermark = () => {
  return (
    <div
      style={{
        position: 'fixed',
        bottom: '20px',
        right: '20px',
        zIndex: 0,
        pointerEvents: 'none',
        opacity: 1
      }}
    >
      <img
        src="/watermarklogo.png"
        alt="watermark"
        style={{
          maxWidth: '200px',
          maxHeight: '200px',
          objectFit: 'contain'
        }}
      />
    </div>
  );
};

export default Watermark;
