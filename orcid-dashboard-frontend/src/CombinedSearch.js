import React, { useState } from 'react';
import { US_INSTITUTIONS, UK_INSTITUTIONS } from './institutions';

const CombinedSearch = ({ onSearch }) => {
  const [searchMode, setSearchMode] = useState('institution');
  const [region, setRegion] = useState('uk');
  const [selectedInstitution, setSelectedInstitution] = useState('');
  const [queryParts, setQueryParts] = useState([{ type: 'ringgold', value: '' }]);

  const handleInstitutionSearch = (e) => {
    e.preventDefault();
    if (selectedInstitution) {
      onSearch(`ringgold=${selectedInstitution}`);
    }
  };

  const handleCustomSearch = (e) => {
    e.preventDefault();
    const query = queryParts.reduce((acc, part) => {
      if (part.value) {
        if (acc) acc += '&';
        acc += `${part.type}=${encodeURIComponent(part.value)}`;
      }
      return acc;
    }, '');
    if (query) {
      onSearch(query);
    }
  };

  const addQueryPart = () => {
    setQueryParts([...queryParts, { type: 'ringgold', value: '' }]);
  };

  const updateQueryPart = (index, field, value) => {
    const newParts = [...queryParts];
    newParts[index][field] = value;
    setQueryParts(newParts);
  };

  const removeQueryPart = (index) => {
    setQueryParts(queryParts.filter((_, i) => i !== index));
  };

  return (
    <div>
      <div>
        <button onClick={() => setSearchMode('institution')}>Search by Institution</button>
        <button onClick={() => setSearchMode('custom')}>Custom Search</button>
      </div>

      {searchMode === 'institution' ? (
        <form onSubmit={handleInstitutionSearch}>
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
          <button type="submit">Search</button>
        </form>
      ) : (
        <form onSubmit={handleCustomSearch}>
          {queryParts.map((part, index) => (
            <div key={index}>
              <select
                value={part.type}
                onChange={(e) => updateQueryPart(index, 'type', e.target.value)}
              >
                <option value="ringgold">Ringgold</option>
                <option value="grid">GRID</option>
                <option value="emaildomain">Email Domain</option>
                <option value="orgname">Organization Name</option>
              </select>
              <input
                type="text"
                value={part.value}
                onChange={(e) => updateQueryPart(index, 'value', e.target.value)}
                placeholder="Enter value"
              />
              <button type="button" onClick={() => removeQueryPart(index)}>Remove</button>
            </div>
          ))}
          <button type="button" onClick={addQueryPart}>Add Query Part</button>
          <button type="submit">Search</button>
        </form>
      )}
    </div>
  );
};

export default CombinedSearch;
