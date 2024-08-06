/**
 * @file dataEnrichment.js
 * @description Enriches ORCID data with additional information from Crossref and DataCite
 * @requires node-fetch
 */

const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

/**
 * @function fetchCrossrefData
 * @async
 * @param {string} doi - DOI of the work
 * @returns {Promise<Object>} Crossref metadata
 */
async function fetchCrossrefData(doi) {
  const url = `https://api.crossref.org/works/${doi}`;
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Crossref API responded with ${response.status}`);
  const data = await response.json();
  return data.message;
}

/**
 * @function fetchDataCiteData
 * @async
 * @param {string} doi - DOI of the work
 * @returns {Promise<Object>} DataCite metadata
 */
async function fetchDataCiteData(doi) {
  const url = `https://api.datacite.org/dois/${doi}`;
  const response = await fetch(url);
  if (!response.ok) throw new Error(`DataCite API responded with ${response.status}`);
  const data = await response.json();
  return data.data.attributes;
}

/**
 * @function enrichOrcidData
 * @async
 * @param {Object} orcidProfile - ORCID profile data
 * @returns {Promise<Object>} Enriched ORCID profile
 */
async function enrichOrcidData(orcidProfile) {
  const enrichedProfile = { ...orcidProfile };
  enrichedProfile.works = await Promise.all(orcidProfile.works.map(async (work) => {
    if (work.doi) {
      try {
        const crossrefData = await fetchCrossrefData(work.doi);
        const dataCiteData = await fetchDataCiteData(work.doi);
        return {
          ...work,
          crossrefData,
          dataCiteData,
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
  return enrichedProfile;
}

module.exports = { enrichOrcidData };
