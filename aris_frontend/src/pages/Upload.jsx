import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { uploadFile } from '../services/api';

const Upload = ({ triggerRefresh }) => {
    const [dragging, setDragging] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [selectedFile, setSelectedFile] = useState(null);
    const [error, setError] = useState("");
    const fileInputRef = useRef(null);
    const navigate = useNavigate();

    const handleDrag = (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === "dragover") setDragging(true);
        else if (e.type === "dragleave") setDragging(false);
    };

    const processFile = async (file) => {
        // RESET STATE IMMEDIATELY (Audit Point 4)
        setError("");
        setSelectedFile(file);
        
        if (!file.name.endsWith('.xlsx')) {
            setError("Invalid file type. Only .xlsx files are supported.");
            setSelectedFile(null);
            return;
        }

        setUploading(true);

        try {
            const result = await uploadFile(file);
            // GLOBAL SYNC (Audit Point 2)
            triggerRefresh(result.summary);
            navigate('/college-toppers');
        } catch (err) {
            setError(err.response?.data?.error || "An unexpected error occurred during processing.");
            setSelectedFile(null);
        } finally {
            setUploading(false);
        }
    };

    const onDrop = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setDragging(false);
        if (uploading) return;
        const file = e.dataTransfer.files[0];
        if (file) processFile(file);
    };

    const onSelect = (e) => {
        if (uploading) return;
        const file = e.target.files[0];
        if (file) processFile(file);
    };

    return (
        <div className="upload-container">
            <h2>Upload Academic Results</h2>
            <p>Drag and drop your Excel (.xlsx) result file below for automated processing.</p>
            
            <div 
                className={`drop-zone ${dragging ? 'active' : ''} ${uploading ? 'uploading' : ''}`}
                onDragOver={handleDrag}
                onDragLeave={handleDrag}
                onDrop={onDrop}
                onClick={() => !uploading && fileInputRef.current.click()}
            >
                <input 
                    type="file" 
                    ref={fileInputRef} 
                    onChange={onSelect} 
                    accept=".xlsx" 
                    style={{ display: 'none' }}
                />
                
                <div className="icon">{uploading ? "⏳" : "📤"}</div>
                {uploading ? (
                    <>
                        <h3>Ingesting Final Results...</h3>
                        <p>{selectedFile?.name}</p>
                    </>
                ) : (
                    <>
                        <h3>{dragging ? "Drop now" : (selectedFile ? selectedFile.name : "Drag & Drop File")}</h3>
                        <p>{selectedFile ? "Click to change file" : "or click to browse"}</p>
                    </>
                )}
            </div>

            {error && (
                <div className="error-card" style={{ marginTop: '24px' }}>
                    <div className="error-header">Upload Failed</div>
                    <div className="error-content">{error}</div>
                </div>
            )}
            
            {!uploading && (
                <div style={{ marginTop: '40px', color: '#64748b', fontSize: '0.875rem', textAlign: 'left' }}>
                    <strong>System Requirements:</strong>
                    <ul style={{ marginTop: '8px' }}>
                        <li>Sheet names must match expected labels (e.g., "SECTION WISE")</li>
                        <li>Toppers are ordered by percentage (or marks if percentage is absent)</li>
                        <li>Pass Percentages must be between 0 and 100</li>
                    </ul>
                </div>
            )}
        </div>
    );
};

export default Upload;
