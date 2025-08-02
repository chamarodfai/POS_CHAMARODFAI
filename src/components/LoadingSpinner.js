import React from 'react';

const LoadingSpinner = ({ message = "กำลังโหลด..." }) => {
  return (
    <>
      <style>{`
        @keyframes spinner-spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        .loading-spinner {
          animation: spinner-spin 1s linear infinite;
        }
      `}</style>
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '40px',
        minHeight: '200px'
      }}>
        <div 
          className="loading-spinner"
          style={{
            width: '40px',
            height: '40px',
            border: '4px solid #f3f3f3',
            borderTop: '4px solid #3498db',
            borderRadius: '50%'
          }}
        ></div>
        <p style={{
          marginTop: '20px',
          color: '#666',
          fontSize: '16px'
        }}>
          {message}
        </p>
      </div>
    </>
  );
};

export default LoadingSpinner;
