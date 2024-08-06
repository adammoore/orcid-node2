/**
 * @file dataEnrichment.js
 * @description Enriches ORCID data with additional information from Crossref and DataCite
 * @author Adam Vials Moore
 * @license Apache-2.0
 */

const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));
const Bottleneck = require('bottleneck');

// Rate limiting to respect API constraints
const limiter = new Bottleneck({
  minTime: 1000 // Minimum time between requests (in milliseconds)
});

/**
 * Fetches data from Crossref API
 * @param {string} doi - DOI of the work
 * @returns {Promise<Object>} Crossref metadata
 */
async function fetchCrossrefData(doi) {
  const url = `https://api.crossref.org/works/${doi}`;
  const response = await limiter.schedule(() => fetch(url));
  if (!response.ok) throw new Error(`Crossref API responded with ${response.status}`);
  const data = await response.json();
  return data.message;
}

/**
 * Fetches data from DataCite API
 * @param {string} doi - DOI of the work
 * @returns {Promise<Object>} DataCite metadata
 */
async function fetchDataCiteData(doi) {
  const url = `https://api.datacite.org/dois/${doi}`;
  const response = await limiter.schedule(() => fetch(url));
  if (!response.ok) throw new Error(`DataCite API responded with ${response.status}`);
  const data = await response.json();
  return data.data.attributes;
}

/**
 * Enriches ORCID profile data with additional information
 * @param {Object} orcidProfile - ORCID profile data
 * @returns {Promise<Object>} Enriched ORCID profile
 */
async function enrichOrcidData(orcidProfile) {
  const enrichedProfile = { ...orcidProfile };
  enrichedProfile.works = await Promise.all(orcidProfile.works.map(async (work) => {
    if (work.doi) {
      try {
        const [crossrefData, dataCiteData] = await Promise.all([
          fetchCrossrefData(work.doi),
          fetchDataCiteData(work.doi)
        ]);

        return {
          ...work,
          crossrefData,
          dataCiteData,
          citationCount: crossrefData['is-referenced-by-count'] || 0,
          collaborators: [...new Set([
            ...(crossrefData.author || []).map(author => author.ORCID),
            ...(dataCiteData.creators || []).map(creator => creator.nameIdentifiers.find(id => id.nameIdentifierScheme === 'ORCID')?.nameIdentifier)
          ])].filter(Boolean)
        };
      } catch (error) {
        console.error(`Error enriching work ${work.doi}:`, error);
        return work;
      }
    }
    return work;
  }));

  // Calculate additional metrics
  enrichedProfile.totalCitations = enrichedProfile.works.reduce((sum, work) => sum + (work.citationCount || 0), 0);
  enrichedProfile.hIndex = calculateHIndex(enrichedProfile.works);

  return enrichedProfile;
}

/**
 * Calculates the h-index for a researcher
 * @param {Array} works - Array of works with citation counts
 * @returns {number} h-index
 */
function calculateHIndex(works) {
  const sortedCitations = works
    .map(work => work.citationCount || 0)
    .sort((a, b) => b - a);

  let hIndex = 0;
  for (let i = 0; i < sortedCitations.length; i++) {
    if (sortedCitations[i] >= i + 1) {
      hIndex = i + 1;
    } else {
      break;
    }
  }

  return hIndex;
}

module.exports = { enrichOrcidData };
