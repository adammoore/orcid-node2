import React, { useState } from 'react';
import { exportToBibTeX, exportToRIS } from './exportUtils';

function AuthorModal({ author, onClose }) {
  const [selectedWorks, setSelectedWorks] = useState([]);

  const toggleWorkSelection = (work) => {
    setSelectedWorks(prev => 
      prev.includes(work) ? prev.filter(w => w !== work) : [...prev, work]
    );
  };

  const handleExport = (format) => {
    const worksToExport = selectedWorks.length > 0 ? selectedWorks : author.works;
    const exportFunc = format === 'bibtex' ? exportToBibTeX : exportToRIS;
    const exported = exportFunc(worksToExport, author);
    const blob = new Blob([exported], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${author.name.replace(/\s+/g, '_')}_works.${format}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="modal">
      <div className="modal-content">
        <h2>{author.name}'s Works</h2>
        <button onClick={() => handleExport('bibtex')}>Export BibTeX</button>
        <button onClick={() => handleExport('ris')}>Export RIS</button>
        <ul>
          {author.works.map((work, index) => (
            <li key={index}>
              <input
                type="checkbox"
                checked={selectedWorks.includes(work)}
                onChange={() => toggleWorkSelection(work)}
              />
              {work.title} ({work.year})
              <br />
              Type: {work.type}
              {work.doi && <>, DOI: {work.doi}</>}
              <pre>{exportToBibTeX([work], author)}</pre>
            </li>
          ))}
        </ul>
        <button onClick={onClose}>Close</button>
      </div>
    </div>
  );
}

export default AuthorModal;
