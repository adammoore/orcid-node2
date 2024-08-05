/**
 * @file App.js
 * @description Main component for the ORCID Institutional Dashboard application.
 * @author [Your Name]
 * @version 1.0.0
 */

import React, { useState, useMemo } from 'react';
import CombinedSearch from './CombinedSearch';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import ForceGraph2D from 'react-force-graph-2d';
import Modal from 'react-modal';
import './App.css';

// Set the app element for react-modal
Modal.setAppElement('#root');

/**
 * Main App component for the ORCID Institutional Dashboard.
 * @returns {React.Component} The rendered App component.
 */
function App() {
  // State declarations
  const [orcidData, setOrcidData] = useState([]);
  const [institutionName, setInstitutionName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [errors, setErrors] = useState([]);
  const [selectedProfile, setSelectedProfile] = useState(null);

  /**
   * Handles the search operation.
   * @async
   * @param {string} query - The search query string.
   */
  const handleSearch = async (query) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/search?${query}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      setOrcidData(data.orcidData);
      setInstitutionName(data.institutionName);
      setErrors(data.errors || []);
    } catch (e) {
      setError(`Failed to fetch data: ${e.message}`);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Clears the server-side cache.
   * @async
   */
const clearCache = async () => {
  try {
    const response = await fetch('/api/clear-cache');
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    alert(data.message);
  } catch (e) {
    alert(`Failed to clear cache: ${e.message}`);
  }
};

  /**
   * Handles data export in various formats.
   * @async
   * @param {string} format - The export format (csv, excel, json, pdf).
   */
  const handleExport = async (format) => {
    try {
      const queryParams = new URLSearchParams(window.location.search);
      const response = await fetch(`/api/export/${format}?${queryParams.toString()}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = `orcid_data.${format}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (e) {
      setError(`Failed to export data: ${e.message}`);
    }
  };

  /**
   * Memoized calculation of chart data for work types.
   * @type {Array}
   */
  const chartData = useMemo(() => {
    if (!orcidData || orcidData.length === 0) return [];
    const workTypes = orcidData.reduce((acc, profile) => {
      (profile.works || []).forEach(work => {
        acc[work.type] = (acc[work.type] || 0) + 1;
      });
      return acc;
    }, {});
    return Object.entries(workTypes).map(([name, value]) => ({ name, value }));
  }, [orcidData]);

  /**
   * Memoized calculation of network data for the collaboration graph.
   * @type {Object}
   */
  const networkData = useMemo(() => {
    if (!orcidData || orcidData.length === 0) return { nodes: [], links: [] };

    const nodes = orcidData.map(profile => ({
      id: profile.orcid,
      name: profile.name || 'Unknown',
      val: (profile.works || []).length,
      color: (profile.employments || []).some(emp => emp.includes(institutionName)) ? '#ff0000' : '#00ff00'
    }));

    const links = [];
    const externalLinks = {};

    orcidData.forEach(profile => {
      (profile.works || []).forEach(work => {
        const collaborators = Array.isArray(work.collaborators) ? work.collaborators : [];
        collaborators.forEach(collaborator => {
          if (orcidData.some(p => p.orcid === collaborator)) {
            links.push({ 
              source: profile.orcid, 
              target: collaborator,
              value: 1
            });
          } else {
            externalLinks[profile.orcid] = externalLinks[profile.orcid] || new Set();
            externalLinks[profile.orcid].add(collaborator);
          }
        });
      });
    });

    Object.entries(externalLinks).forEach(([orcid, collaborators]) => {
      const externalNodeId = `external_${orcid}`;
      nodes.push({
        id: externalNodeId,
        name: 'External Collaborators',
        val: collaborators.size,
        color: '#0000ff'
      });
      links.push({
        source: orcid,
        target: externalNodeId,
        value: collaborators.size,
        label: `${collaborators.size} external collaborators`
      });
    });

    return { nodes, links };
  }, [orcidData, institutionName]);

  /**
   * Memoized calculation of collaboration ratio.
   * @type {number}
   */
  const collaborationRatio = useMemo(() => {
    if (!orcidData || orcidData.length === 0) return 0;

    let internalCollaborations = 0;
    let externalCollaborations = 0;

    orcidData.forEach(profile => {
      (profile.works || []).forEach(work => {
        (work.collaborators || []).forEach(collaborator => {
          if (orcidData.some(p => p.orcid === collaborator)) {
            internalCollaborations++;
          } else {
            externalCollaborations++;
          }
        });
      });
    });

    return internalCollaborations === 0 ? 0 : externalCollaborations / internalCollaborations;
  }, [orcidData]);


  const [chartType, setChartType] = useState('workTypes');

  const workTypes = useMemo(() => {
    if (!orcidData || orcidData.length === 0) return [];
    const types = orcidData.reduce((acc, profile) => {
      (profile.works || []).forEach(work => {
        acc[work.type] = (acc[work.type] || 0) + 1;
      });
      return acc;
    }, {});
    return Object.entries(types).map(([name, value]) => ({ name, value }));
  }, [orcidData]);

  /**
   * Memoized calculation of works by year.
   * @type {Array}
   */
  const worksByYear = useMemo(() => {
    if (!orcidData || orcidData.length === 0) return [];

    const workCounts = orcidData.reduce((acc, profile) => {
      (profile.works || []).forEach(work => {
        const year = work.year || 'Unknown';
        acc[year] = (acc[year] || 0) + 1;
      });
      return acc;
    }, {});

    return Object.entries(workCounts)
      .map(([year, count]) => ({ year, count }))
      .sort((a, b) => a.year === 'Unknown' ? 1 : b.year === 'Unknown' ? -1 : a.year - b.year);
  }, [orcidData]);

  const topAuthors = useMemo(() => {
    return orcidData
      .map(profile => ({
        name: profile.name,
        works: profile.works.length
      }))
      .sort((a, b) => b.works - a.works)
      .slice(0, 10);
  }, [orcidData]);

  const authorConnections = useMemo(() => {
    const connections = orcidData.map(profile => ({
      name: profile.name,
      connections: new Set(profile.works.flatMap(work => work.collaborators || [])).size
    }));
    return connections.sort((a, b) => b.connections - a.connections).slice(0, 10);
  }, [orcidData]);

  const renderChart = () => {
    switch (chartType) {
      case 'workTypes':
        return (
          <PieChart width={400} height={400}>
            <Pie data={workTypes} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={150} fill="#8884d8" label>
              {workTypes.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={`#${Math.floor(Math.random()*16777215).toString(16)}`} />
              ))}
            </Pie>
            <Tooltip />
            <Legend />
          </PieChart>
        );
      case 'worksByYear':
        return (
          <BarChart data={worksByYear}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="year" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="count" fill="#8884d8" />
          </BarChart>
        );
      case 'topAuthors':
        return (
          <BarChart data={topAuthors}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="works" fill="#82ca9d" />
          </BarChart>
        );
      case 'authorConnections':
        return (
          <BarChart data={authorConnections}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="connections" fill="#8884d8" />
          </BarChart>
        );
      default:
        return null;
    }
  };

  return (
    <div className="App">
      <h1>ORCID Institutional Dashboard</h1>
      <CombinedSearch onSearch={handleSearch} />
      <button onClick={clearCache}>Clear Cache</button>

      {loading && <div>Loading...</div>}
      {error && <div>Error: {error}</div>}

      {orcidData.length > 0 && (
        <div>
          <div className="export-buttons">
            <button onClick={() => handleExport('csv')}>Export CSV</button>
            <button onClick={() => handleExport('excel')}>Export Excel</button>
            <button onClick={() => handleExport('json')}>Export JSON</button>
            <button onClick={() => handleExport('pdf')}>Export PDF</button>
          </div>

          <h2>{institutionName} ORCID Dashboard</h2>

          <h3>Researcher Collaboration Network</h3>
          <div style={{ height: '600px' }}>
            <ForceGraph2D
              graphData={networkData}
              nodeLabel="name"
              nodeVal="val"
              nodeAutoColorBy="color"
              linkDirectionalParticles={2}
              linkLabel="label"
            />
          </div>

          <h3>Collaboration Ratio (External/Internal): {collaborationRatio.toFixed(2)}</h3>

      <div>
        <h3>Dashboard</h3>
        <select onChange={(e) => setChartType(e.target.value)}>
          <option value="workTypes">Work Types</option>
          <option value="worksByYear">Works by Year</option>
          <option value="topAuthors">Top 10 Authors</option>
          <option value="authorConnections">Top 10 Connected Authors</option>
        </select>
        <ResponsiveContainer width="100%" height={400}>
          {renderChart()}
        </ResponsiveContainer>
      </div>



          <h3>ORCID Data</h3>
          <table>
            <thead>
              <tr>
                <th>ORCID ID</th>
                <th>Name</th>
                <th>Last Updated</th>
                <th>Employments</th>
                <th>Educations</th>
                <th>Works</th>
              </tr>
            </thead>
            <tbody>
              {orcidData.map(profile => (
                <tr key={profile.orcid}>
                  <td>{profile.orcid}</td>
                  <td>{profile.name}</td>
                  <td>{profile.lastUpdated}</td>
                  <td>{profile.employments.join('; ')}</td>
                  <td>{profile.educations.join('; ')}</td>
                  <td>
                    <button onClick={() => setSelectedProfile(profile)}>
                      {profile.works.length} works
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <Modal
            isOpen={!!selectedProfile}
            onRequestClose={() => setSelectedProfile(null)}
            contentLabel="Works Details"
          >
            {selectedProfile && (
              <>
                <h2>{selectedProfile.name}'s Works</h2>
                <ul>
                  {selectedProfile.works.map((work, index) => (
                    <li key={index}>
                      {work.title} ({work.type}) - {work.year}
                    </li>
                  ))}
                </ul>
                <button onClick={() => setSelectedProfile(null)}>Close</button>
              </>
            )}
          </Modal>

          {errors.length > 0 && (
            <div className="error-summary">
              <h3>Errors Encountered</h3>
              <p>{errors.length} ORCID profiles could not be retrieved:</p>
              <ul>
                {errors.map((error, index) => (
                  <li key={index}>{error.orcid}: {error.error}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default App;
