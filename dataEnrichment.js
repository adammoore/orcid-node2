/**
 * @fileoverview Data enrichment functions for ORCID profiles
 * @module dataEnrichment
 */

const fetch = require('node-fetch');

/**
 * Enrich ORCID profile with institutional repository data
 * @async
 * @param {Object} profile - ORCID profile object
 * @param {string} repositoryUrl - URL of the institutional repository API
 * @returns {Object} Enriched ORCID profile
 */
const { OAIPMHClient } = require('oai-pmh');

async function enrichWithRepositoryData(profile, repositoryUrl) {
  if (!repositoryUrl) {
    console.warn('Repository URL not provided. Skipping repository data enrichment.');
    return profile;
  }

  try {
    const client = new OAIPMHClient(repositoryUrl);
    
    // Fetch records for the given ORCID
    const records = await client.listRecords({
      metadataPrefix: 'oai_dc',
      from: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(), // Last 30 days
      set: `orcid:${profile.orcid}` // Assuming the repository supports ORCID sets
    });

    const repoWorks = [];
    for await (const record of records) {
      const metadata = record.metadata['oai_dc:dc'];
      repoWorks.push({
        title: metadata['dc:title'][0],
        type: metadata['dc:type'][0],
        year: metadata['dc:date'][0].split('-')[0],
        doi: metadata['dc:identifier'].find(id => id.startsWith('doi:'))?.replace('doi:', '') || null
      });
    }

    // Merge repository works with ORCID works
    profile.works = [...(profile.works || []), ...repoWorks.filter(work => 
      !profile.works?.some(orcidWork => orcidWork.doi === work.doi)
    )];

    return profile;
  } catch (error) {
    console.error(`Error enriching profile with repository data: ${error}`);
    return profile;
  }
}


/**
 * Enrich work entries with DOI metadata
 * @async
 * @param {Object} work - Work object from ORCID profile
 * @returns {Object} Enriched work object
 */
async function enrichWorkWithDOIMetadata(work) {
  if (!work.doi) return work;

  try {
    const response = await fetch(`https://api.crossref.org/works/${work.doi}`);
    const metadata = await response.json();

    // Merge metadata with work data
    return { ...work, ...metadata.message };
  } catch (error) {
    console.error(`Error enriching work with DOI metadata: ${error}`);
    return work;
  }
}

module.exports = {
  enrichWithRepositoryData,
  enrichWorkWithDOIMetadata
};
