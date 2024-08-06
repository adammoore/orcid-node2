/**
 * @file App.js
 * @description Main component for the ORCID Institutional Dashboard
 * @author Adam Vials Moore
 * @license Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import CombinedSearch from './CombinedSearch';
import InstitutionalDashboard from './InstitutionalDashboard';
import AuthorModal from './AuthorModal';
import EnrichmentReport from './EnrichmentReport';
import { exportToFile } from './exportUtils';
import './App.css';

function App() {
  const [orcidData, setOrcidData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedAuthor, setSelectedAuthor] = useState(null);
  const [institutionName, setInstitutionName] = useState('');

  /**
   * Fetches ORCID data based on the provided query
   * @param {string} query - The search query
   */
  const fetchData = async (query) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      const data = await response.json();
      setOrcidData(data);
      // Extract institution name from the query
      const institutionMatch = query.match(/orgname=([^&]+)/);
      setInstitutionName(institutionMatch ? decodeURIComponent(institutionMatch[1]) : '');
    } catch (e) {
      setError(`Failed to fetch data: ${e.message}`);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Handles the export of data in various formats
   * @param {string} format - The export format (e.g., 'csv', 'json')
   */
  const handleExport = (format) => {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `orcid_export_${timestamp}`;
    exportToFile(orcidData, format, filename);
  };

  return (
    <div className="App">
      <h1>ORCID Institutional Dashboard</h1>
      <CombinedSearch onSearch={fetchData} />
      {loading && <div className="loading">Loading<span>.</span><span>.</span><span>.</span></div>}
      {error && <div className="error-container">Error: {error}</div>}
      {orcidData.length > 0 && (
        <>
          <div className="export-buttons">
            {['csv', 'excel', 'json', 'pdf', 'bibtex', 'ris'].map(format => (
              <button key={format} onClick={() => handleExport(format)}>
                Export {format.toUpperCase()}
              </button>
            ))}
          </div>
          <InstitutionalDashboard orcidData={orcidData} institutionName={institutionName} />
          <EnrichmentReport orcidData={orcidData} />
          <table>
            <thead>
              <tr>
                <th>ORCID</th>
                <th>Name</th>
                <th>Works</th>
              </tr>
            </thead>
            <tbody>
              {orcidData.map(author => (
                <tr key={author.orcid}>
                  <td>{author.orcid}</td>
                  <td>{author.name}</td>
                  <td>
                    <button onClick={() => setSelectedAuthor(author)}>
                      View {author.works.length} works
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {selectedAuthor && (
            <AuthorModal
              author={selectedAuthor}
              onClose={() => setSelectedAuthor(null)}
            />
          )}
        </>
      )}
    </div>
  );
}

export default App;
