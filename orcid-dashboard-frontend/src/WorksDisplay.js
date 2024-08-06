/**
 * @file WorksDisplay.js
 * @description Component for displaying and exporting individual works
 * @requires react
 */

import React, { useState } from 'react';
import { exportToBibTeX, exportToRIS } from './exportUtils';

/**
 * @function WorksDisplay
 * @param {Object} props - Component props
 * @param {Array} props.works - Array of work objects
 * @returns {JSX.Element} Works display component
 */
function WorksDisplay({ works }) {
  const [expandedWork, setExpandedWork] = useState(null);

  /**
   * @function handleExport
   * @param {Object} work - Work to export
   * @param {string} format - Export format ('bibtex' or 'ris')
   */
  const handleExport = (work, format) => {
    const exportFunc = format === 'bibtex' ? exportToBibTeX : exportToRIS;
    const exported = exportFunc(work);
    const blob = new Blob([exported], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `work_${work.doi || 'unknown'}.${format}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="works-display">
      <h3>Works</h3>
      {works.map((work, index) => (
        <div key={index} className="work-item">
          <h4 onClick={() => setExpandedWork(expandedWork === index ? null : index)}>
            {work.title} ({work.year})
          </h4>
          {expandedWork === index && (
            <div className="work-details">
              <p>Type: {work.type}</p>
              <p>Journal: {work.journal}</p>
              <p>DOI: {work.doi}</p>
              <div className="work-export-buttons">
                <button onClick={() => handleExport(work, 'bibtex')}>Export BibTeX</button>
                <button onClick={() => handleExport(work, 'ris')}>Export RIS</button>
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

export default WorksDisplay;
