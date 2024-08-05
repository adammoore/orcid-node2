import React, { useState, useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import ForceGraph2D from 'react-force-graph-2d';
import Modal from 'react-modal';
import { US_INSTITUTIONS, UK_INSTITUTIONS } from './institutions';
import './App.css';

// Set the app element for react-modal
Modal.setAppElement('#root');  // Assuming your main div has id="root"


function App() {
  const [orcidData, setOrcidData] = useState([]);
  const [institutionName, setInstitutionName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [region, setRegion] = useState('uk');
  const [selectedInstitution, setSelectedInstitution] = useState('');
  const [email, setEmail] = useState('');
  const [affiliation, setAffiliation] = useState('');
  const [errors, setErrors] = useState([]);
  const [selectedProfile, setSelectedProfile] = useState(null);

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


  const fetchData = async () => {
    setLoading(true);
    setError(null);
    setErrors([]);
    try {
      let queryParams = new URLSearchParams();
      if (selectedInstitution) {
        queryParams.append('ringgold', selectedInstitution);
      }
      if (email) {
        queryParams.append('emaildomain', email);
      }
      if (affiliation) {
        queryParams.append('orgname', affiliation);
      }

      const response = await fetch(`/api/search?${queryParams.toString()}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      if (data.orcidData.length === 0) {
        setError('No data found for this query');
      } else {
        setOrcidData(data.orcidData);
        setErrors(data.errors || []);
        setInstitutionName(data.institutionName);
      }
    } catch (e) {
      setError(`Failed to fetch data: ${e.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    fetchData();
  };

  const handleExport = async (format) => {
    try {
      let queryParams = new URLSearchParams();
      if (selectedInstitution) {
        queryParams.append('ringgold', selectedInstitution);
      }
      if (email) {
        queryParams.append('emaildomain', email);
      }
      if (affiliation) {
        queryParams.append('orgname', affiliation);
      }

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

  const chartData = useMemo(() => {
    if (!orcidData || orcidData.length === 0) return [];
    return Object.entries(
      orcidData.reduce((acc, profile) => {
        if (profile.works) {
          profile.works.forEach(work => {
            acc[work.type] = (acc[work.type] || 0) + 1;
          });
        }
        return acc;
      }, {})
    ).map(([name, value]) => ({ name, value }));
  }, [orcidData]);


  const graphData = useMemo(() => {
    if (!orcidData || orcidData.length === 0) return { nodes: [], links: [] };
    return {
      nodes: orcidData.map(profile => ({ id: profile.orcid, name: profile.name })),
      links: orcidData.flatMap(profile => 
        profile.works ? profile.works.map(work => ({
          source: profile.orcid,
          target: work.collaborators ? work.collaborators[0] : profile.orcid,
        })) : []
      )
    };
  }, [orcidData]);

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
      // Ensure collaborators is an array
      const collaborators = Array.isArray(work.collaborators) ? work.collaborators : [];
      collaborators.forEach(collaborator => {
        if (orcidData.some(p => p.orcid === collaborator)) {
          // Internal collaboration
          links.push({ 
            source: profile.orcid, 
            target: collaborator,
            value: 1 // You can adjust this value based on the number of collaborations
          });
        } else {
          // External collaboration
          externalLinks[profile.orcid] = externalLinks[profile.orcid] || new Set();
          externalLinks[profile.orcid].add(collaborator);
        }
      });
    });
  });

  // Add external collaboration nodes and links
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

const worksByYear = useMemo(() => {
  if (!orcidData || orcidData.length === 0) return [];

  const workCounts = {};
  orcidData.forEach(profile => {
    (profile.works || []).forEach(work => {
      const year = work.year || 'Unknown';
      workCounts[year] = (workCounts[year] || 0) + 1;
    });
  });

  return Object.entries(workCounts)
    .map(([year, count]) => ({ year, count }))
    .sort((a, b) => a.year === 'Unknown' ? 1 : b.year === 'Unknown' ? -1 : a.year - b.year);
}, [orcidData]);

  return (
    <div className="App">
      <h1>ORCID Dashboard</h1>
      
      {loading && <div className="loading">Loading<span>.</span><span>.</span><span>.</span></div>}

      {error && (
        <div className="error-container">
          <p className="error-message">{error}</p>
          <button onClick={fetchData} className="retry-button">Retry</button>
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <select value={region} onChange={(e) => setRegion(e.target.value)}>
          <option value="uk">UK</option>
          <option value="us">US</option>
        </select>
        <select 
          value={selectedInstitution} 
          onChange={(e) => setSelectedInstitution(e.target.value)}
        >
          <option value="">Select an institution</option>
          {(region === 'uk' ? UK_INSTITUTIONS : US_INSTITUTIONS).map(inst => (
            <option key={inst.ringgold} value={inst.ringgold}>{inst.name}</option>
          ))}
        </select>
        <input
          type="text"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email domain"
        />
        <input
          type="text"
          value={affiliation}
          onChange={(e) => setAffiliation(e.target.value)}
          placeholder="Affiliation"
        />
        <button type="submit">Search</button>
      </form>

      <button onClick={clearCache}>Clear Cache</button>



      {institutionName && (
        <>
          <h2>{institutionName}</h2>
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

          <h3>Works by Year</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={worksByYear}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="year" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="count" fill="#8884d8" />
            </BarChart>
          </ResponsiveContainer>

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
        </>
      )}
    </div>
  );
}

export default App;
