import React, { useState, useRef } from 'react';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';

function UniversalIngestionStudio() {
  const [file, setFile] = useState(null);
  const [headers, setHeaders] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedColumns, setSelectedColumns] = useState([]); 
  const [isListExpanded, setIsListExpanded] = useState(false); // Toggle for full view list
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState({ type: '', msg: '' });
  
  const fileInputRef = useRef(null);

  // Default threshold visibility
  const DIRECT_CHIPS_LIMIT = 4;

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      setFile(selectedFile);
      setSelectedColumns([]); 
      setSearchQuery('');
      setIsListExpanded(false);
      
      const extension = selectedFile.name.split('.').pop().toLowerCase();
      setStatus({ type: 'info', msg: `Ingesting document format: .${extension.toUpperCase()}` });

      if (extension === 'csv' || extension === 'txt') {
        const reader = new FileReader();
        reader.onload = (event) => {
          const firstLine = event.target.result.split('\n')[0];
          const detected = firstLine.split(',').map(h => h.trim().replace(/"/g, '')).filter(h => h.length > 0);
          setHeaders(detected);
        };
        reader.readAsText(selectedFile.slice(0, 3000));
      } else {
        // Mocking large schema for Excel/PDF parsing testing
        setHeaders(["customer_id", "full_name", "first_name", "last_name", "email_address", "phone_number", "alt_phone", "city_details", "postal_code", "country_zone", "registration_date", "account_status"]);
      }
    }
  };

  const toggleColumnSelection = (col) => {
    if (selectedColumns.includes(col)) {
      setSelectedColumns(selectedColumns.filter(c => c !== col));
    } else {
      setSelectedColumns([...selectedColumns, col]);
    }
  };

  const handleUpload = async () => {
    if (!file) {
      setStatus({ type: 'error', msg: 'Operational Halt: Please stream a document matrix first.' });
      return;
    }
    if (selectedColumns.length === 0) {
      setStatus({ type: 'error', msg: 'Configuration Blank: Map targets via selection badges.' });
      return;
    }

    setLoading(true);
    setStatus({ type: 'process', msg: 'Engine mapping custom projections...' });

    const formData = new FormData();
    formData.append('file', file);
    formData.append('projectedColumns', selectedColumns.join(','));

    try {
      const response = await fetch(`${API_BASE_URL}/api/pipeline/process-universal`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) throw new Error('Dynamic Stream Ingestion Failure.');

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `filtered_projections_${Date.now()}.zip`);
      document.body.appendChild(link);
      link.click();
      
      setStatus({ type: 'success', msg: 'Extraction Success! Filtered Excel data inside ZIP generated safely.' });
    } catch (error) {
      setStatus({ type: 'error', msg: 'Pipeline Terminal Error: Target cluster infrastructure dropped transaction.' });
    } finally {
      setLoading(false);
    }
  };

  // --- REQUISITE ADVANCED FUZZY MATCH FILTER ENGINE ---
  // If search query is less than 2 characters, show default chips or list. 
  // If 2 or more characters are typed, execute deep substring matching anywhere inside the words.
  const getFilteredHeaders = () => {
    if (searchQuery.trim().length < 2) {
      // When not searching, return elements based on show more/less toggle state
      return isListExpanded ? headers : headers.slice(0, DIRECT_CHIPS_LIMIT);
    }
    return headers.filter(h => h.toLowerCase().includes(searchQuery.toLowerCase().trim()));
  };

  const displayHeaders = getFilteredHeaders();
  const hasHiddenColumns = headers.length > DIRECT_CHIPS_LIMIT;

  return (
    <div style={{
      padding: '40px 35px', maxWidth: '600px', margin: '40px auto', 
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      background: 'linear-gradient(135deg, #020617 0%, #1e1b4b 100%)', borderRadius: '24px',
      boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.8)', border: '1px solid rgba(255, 255, 255, 0.05)'
    }}>
      <h2 style={{ margin: 0, color: '#ffffff', fontSize: '24px', fontWeight: '800', letterSpacing: '-0.5px' }}>
        Dynamic Ingestion Studio
      </h2>
      <p style={{ margin: '5px 0 25px 0', color: '#94a3b8', fontSize: '14px' }}>
        Multi-format custom projection engine with adaptive search schema selectors.
      </p>

      {/* File Dropper Zone */}
      <div onClick={() => fileInputRef.current.click()}
        style={{
          border: '2px dashed #475569', padding: '25px 20px', borderRadius: '16px',
          background: 'rgba(15, 23, 42, 0.6)', textAlign: 'center', cursor: 'pointer', marginBottom: '25px'
        }}
      >
        <input ref={fileInputRef} type="file" accept=".csv,.xlsx,.xls,.pdf,.docx" onChange={handleFileChange} style={{ display: 'none' }} />
        <div style={{ fontSize: '32px', marginBottom: '10px' }}>📊</div>
        <p style={{ margin: '0 0 4px 0', color: '#e2e8f0', fontSize: '15px', fontWeight: '600' }}>
          {file ? file.name : "Drop data source document here"}
        </p>
        <p style={{ margin: 0, color: '#64748b', fontSize: '12px' }}>Supports CSV, Excel, PDF, Word</p>
      </div>

      {/* Advanced Interactive Control Panel */}
      {headers.length > 0 && (
        <div style={{ background: 'rgba(30, 41, 59, 0.4)', padding: '20px', borderRadius: '16px', marginBottom: '25px', border: '1px solid rgba(255, 255, 255, 0.05)' }}>
          <h4 style={{ margin: '0 0 12px 0', color: '#f8fafc', fontSize: '14px', fontWeight: '700', textTransform: 'uppercase' }}>
            Interactive Field Configurator
          </h4>

          {/* Search Input Box with Icon Embed */}
          <div style={{ position: 'relative', marginBottom: '16px' }}>
            <span style={{ position: 'absolute', left: '12px', top: '11px', color: '#64748b' }}>🔍</span>
            <input 
              type="text" 
              placeholder="Search column names (e.g., 'me' for name, email)..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: '100%', padding: '10px 10px 10px 38px', borderRadius: '8px', border: '1px solid #475569',
                background: '#0f172a', color: '#ffffff', fontSize: '14px', outline: 'none', boxSizing: 'border-box'
              }}
            />
            {searchQuery.trim().length > 0 && searchQuery.trim().length < 2 && (
              <span style={{ fontSize: '11px', color: '#facc15', display: 'block', marginTop: '6px' }}>
                💡 Type at least 2 characters to auto-suggest matched substrings.
              </span>
            )}
          </div>

          {/* Active Target Projection Stack Tracker */}
          <div style={{ marginBottom: '16px', fontSize: '13px', color: '#94a3b8' }}>
            Target Pipeline Stack: {selectedColumns.length === 0 ? <b style={{ color: '#ef4444' }}>Empty (Choose below)</b> : 
              selectedColumns.map((c, i) => <span key={i} style={{ color: '#22c55e', fontWeight: 'bold', marginRight: '8px' }}>[{c}]</span>)}
          </div>

          {/* Chips Render Area */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', transition: 'all 0.3s ease' }}>
            {displayHeaders.map((h, i) => {
              const isSelected = selectedColumns.includes(h);
              return (
                <button 
                  key={i} 
                  onClick={() => toggleColumnSelection(h)} 
                  style={{
                    padding: '6px 12px', borderRadius: '20px', fontSize: '13px', cursor: 'pointer', border: 'none',
                    background: isSelected ? 'linear-gradient(90deg, #4f46e5, #6366f1)' : '#1e293b',
                    color: '#ffffff', fontWeight: isSelected ? '700' : 'normal',
                    transition: 'all 0.2s'
                  }}
                >
                  {isSelected ? '✓ ' : '+ '} {h}
                </button>
              );
            })}
          </div>

          {/* Expandable Option List Controller Toggle Link */}
          {hasHiddenColumns && searchQuery.trim().length < 2 && (
            <div style={{ marginTop: '14px', textAlign: 'right' }}>
              <button 
                onClick={() => setIsListExpanded(!isListExpanded)}
                style={{
                  background: 'none', border: 'none', color: '#38bdf8', fontSize: '13px',
                  cursor: 'pointer', fontWeight: '600', textDecoration: 'underline', outline: 'none'
                }}
              >
                {isListExpanded ? "🗏 Show Standard Direct Fields Only" : `📋 View Complete Option List (+${headers.length - DIRECT_CHIPS_LIMIT} hidden columns)`}
              </button>
            </div>
          )}

          {displayHeaders.length === 0 && (
            <p style={{ color: '#64748b', fontSize: '12px', fontStyle: 'italic', margin: '5px 0 0 0' }}>No matching structural columns found.</p>
          )}
        </div>
      )}

      {/* Execute Pipeline Stream */}
      <button onClick={handleUpload} disabled={loading}
        style={{
          width: '100%', padding: '15px', background: loading ? '#334155' : 'linear-gradient(90deg, #10b981 0%, #059669 100%)',
          color: '#ffffff', border: 'none', borderRadius: '10px', cursor: loading ? 'not-allowed' : 'pointer',
          fontWeight: '700', fontSize: '15px', boxShadow: loading ? 'none' : '0 10px 20px -5px rgba(16, 185, 129, 0.4)'
        }}
      >
        {loading ? 'Compiling Projections Payload...' : 'Run Filter Pipeline & Export Custom ZIP'}
      </button>

      {status.msg && (
        <div style={{ marginTop: '20px', padding: '12px 16px', background: status.type === 'error' ? '#2d1e22' : '#1e293b', borderRadius: '8px', fontSize: '13px', color: status.type === 'error' ? '#ff6b8b' : '#38bdf8', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span>⚙</span><span>{status.msg}</span>
        </div>
      )}
    </div>
  );
}

export default UniversalIngestionStudio;