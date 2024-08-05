/**
 * @fileoverview Advanced analytics functions for ORCID data
 * @module analytics
 */

/**
 * Analyze collaboration patterns over time
 * @param {Array} orcidData - Array of ORCID profiles
 * @returns {Object} Collaboration patterns by year
 */
function analyzeCollaborationPatterns(orcidData) {
  const patterns = {};
  orcidData.forEach(profile => {
    profile.works.forEach(work => {
      const year = work.year || 'Unknown';
      patterns[year] = patterns[year] || { internal: 0, external: 0 };
      work.collaborators.forEach(collaborator => {
        if (orcidData.some(p => p.orcid === collaborator)) {
          patterns[year].internal++;
        } else {
          patterns[year].external++;
        }
      });
    });
  });
  return patterns;
}

/**
 * Identify key researchers based on network centrality
 * @param {Array} orcidData - Array of ORCID profiles
 * @returns {Array} Sorted array of researchers by centrality score
 */
function identifyKeyResearchers(orcidData) {
  const centralityScores = orcidData.map(profile => {
    const collaborations = profile.works.reduce((acc, work) => acc + work.collaborators.length, 0);
    const uniqueCollaborators = new Set(profile.works.flatMap(work => work.collaborators)).size;
    return {
      orcid: profile.orcid,
      name: profile.name,
      centralityScore: collaborations * uniqueCollaborators
    };
  });
  return centralityScores.sort((a, b) => b.centralityScore - a.centralityScore);
}

module.exports = {
  analyzeCollaborationPatterns,
  identifyKeyResearchers
};
