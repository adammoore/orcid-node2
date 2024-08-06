import React from 'react';

function EnrichmentReport({ orcidData }) {
  const missingDOIs = orcidData.reduce((acc, author) => {
    const missingWorks = author.works.filter(work => !work.doi).length;
    if (missingWorks > 0) {
      acc.push({ name: author.name, count: missingWorks });
    }
    return acc;
  }, []);

  const incompleteProfiles = orcidData.filter(author => 
    !author.educations.length || !author.employments.length
  );

  return (
    <div className="enrichment-report">
      <h2>Enrichment Opportunities</h2>
      <h3>Works Missing DOIs</h3>
      <ul>
        {missingDOIs.map((item, index) => (
          <li key={index}>{item.name}: {item.count} works</li>
        ))}
      </ul>
      <h3>Incomplete Profiles</h3>
      <ul>
        {incompleteProfiles.map((author, index) => (
          <li key={index}>{author.name}: Missing {!author.educations.length ? 'education' : ''} {!author.employments.length ? 'employment' : ''}</li>
        ))}
      </ul>
    </div>
  );
}

export default EnrichmentReport;
