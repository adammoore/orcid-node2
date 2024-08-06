const https = require('https');
const querystring = require('querystring');

/**
 * Fetches ORCID data based on the provided query
 * @param {string} query - The search query (e.g., 'ringgold=123456' or 'email=example.com')
 * @returns {Promise<Array>} Array of ORCID profiles
 */
async function fetchOrcidData(query) {
  const baseUrl = 'https://pub.orcid.org/v3.0/search/';
  
  const searchParams = querystring.stringify({
    q: query,
    rows: 100 // Adjust this number based on how many results you want to retrieve
  });

  const options = {
    headers: {
      'Accept': 'application/orcid+json'
    }
  };

  try {
    const searchResults = await makeRequest(`${baseUrl}?${searchParams}`, options);
    
    console.log('API Response:', JSON.stringify(searchResults, null, 2));

    if (!searchResults.result || !Array.isArray(searchResults.result)) {
      console.error('Unexpected API response structure:', searchResults);
      return [];
    }

    const orcidProfiles = [];

    for (const result of searchResults.result) {
      if (result['orcid-identifier'] && result['orcid-identifier'].path) {
        const orcidId = result['orcid-identifier'].path;
        try {
          const profile = await fetchOrcidProfile(orcidId, options);
          orcidProfiles.push(profile);
        } catch (error) {
          console.error(`Error fetching profile for ORCID ${orcidId}:`, error);
        }
      }
    }

    return orcidProfiles;
  } catch (error) {
    console.error('Error in fetchOrcidData:', error);
    return [];
  }
}

/**
 * Fetches an individual ORCID profile
 * @param {string} orcidId - The ORCID iD
 * @param {Object} options - Request options
 * @returns {Promise<Object>} ORCID profile data
 */
async function fetchOrcidProfile(orcidId, options) {
  const baseUrl = `https://pub.orcid.org/v3.0/${orcidId}`;
  const profile = await makeRequest(baseUrl, options);

  return {
    orcid: orcidId,
    name: getFullName(profile),
    biography: getBiography(profile),
    educations: getEducations(profile),
    employments: getEmployments(profile),
    works: getWorks(profile),
    funding: getFunding(profile),
    peerReviews: getPeerReviews(profile),
    researchResources: getResearchResources(profile),
    services: getServices(profile),
    lastModifiedDate: profile['history'] && profile['history']['last-modified-date'] ? profile['history']['last-modified-date'].value : null
  };
}

// Helper functions to extract specific data from the ORCID profile

function getFullName(profile) {
  if (profile.person && profile.person.name) {
    const givenNames = profile.person.name['given-names'] ? profile.person.name['given-names'].value : '';
    const familyName = profile.person.name['family-name'] ? profile.person.name['family-name'].value : '';
    return `${givenNames} ${familyName}`.trim() || 'Name not provided';
  }
  return 'Name not provided';
}

function getBiography(profile) {
  return profile.person && profile.person.biography ? profile.person.biography.content : null;
}

function getEducations(profile) {
  if (profile['activities-summary'] && profile['activities-summary'].educations && profile['activities-summary'].educations['education-summary']) {
    return profile['activities-summary'].educations['education-summary'].map(edu => ({
      organization: edu.organization ? edu.organization.name : 'Unknown',
      role: edu['role-title'],
      startDate: formatDate(edu['start-date']),
      endDate: formatDate(edu['end-date'])
    }));
  }
  return [];
}

function getEmployments(profile) {
  if (profile['activities-summary'] && profile['activities-summary'].employments && profile['activities-summary'].employments['employment-summary']) {
    return profile['activities-summary'].employments['employment-summary'].map(emp => ({
      organization: emp.organization ? emp.organization.name : 'Unknown',
      role: emp['role-title'],
      startDate: formatDate(emp['start-date']),
      endDate: formatDate(emp['end-date'])
    }));
  }
  return [];
}

function getWorks(profile) {
  if (profile['activities-summary'] && profile['activities-summary'].works && profile['activities-summary'].works.group) {
    return profile['activities-summary'].works.group.map(work => ({
      title: work['work-summary'][0]['title'] ? work['work-summary'][0]['title'].title.value : 'Unknown',
      type: work['work-summary'][0].type,
      publicationDate: formatDate(work['work-summary'][0]['publication-date']),
      doi: work['work-summary'][0]['external-ids'] && work['work-summary'][0]['external-ids']['external-id'] ?
        work['work-summary'][0]['external-ids']['external-id'].find(id => id['external-id-type'] === 'doi')?.['external-id-value'] : null
    }));
  }
  return [];
}

function getFunding(profile) {
  if (profile['activities-summary'] && profile['activities-summary'].fundings && profile['activities-summary'].fundings.group) {
    return profile['activities-summary'].fundings.group.map(funding => ({
      title: funding['funding-summary'][0]['title'] ? funding['funding-summary'][0]['title'].title.value : 'Unknown',
      type: funding['funding-summary'][0].type,
      organization: funding['funding-summary'][0]['organization'] ? funding['funding-summary'][0]['organization'].name : 'Unknown'
    }));
  }
  return [];
}

function getPeerReviews(profile) {
  if (profile['activities-summary'] && profile['activities-summary']['peer-reviews'] && profile['activities-summary']['peer-reviews'].group) {
    return profile['activities-summary']['peer-reviews'].group.map(review => {
      if (review['peer-review-summary'] && review['peer-review-summary'][0]) {
        return {
          type: review['peer-review-summary'][0].type,
          completionDate: formatDate(review['peer-review-summary'][0]['completion-date'])
        };
      }
      return null;
    }).filter(Boolean);
  }
  return [];
}

function getResearchResources(profile) {
  if (profile['activities-summary'] && profile['activities-summary']['research-resources'] && profile['activities-summary']['research-resources'].group) {
    return profile['activities-summary']['research-resources'].group.map(resource => {
      if (resource['research-resource-summary'] && resource['research-resource-summary'][0] && resource['research-resource-summary'][0]['proposal']) {
        return {
          title: resource['research-resource-summary'][0]['proposal']['title'] ? resource['research-resource-summary'][0]['proposal']['title'].title.value : 'Unknown',
          type: resource['research-resource-summary'][0]['proposal'].type
        };
      }
      return null;
    }).filter(Boolean);
  }
  return [];
}

function getServices(profile) {
  if (profile['activities-summary'] && profile['activities-summary'].services && profile['activities-summary'].services['service-summary']) {
    return profile['activities-summary'].services['service-summary'].map(service => ({
      organization: service.organization ? service.organization.name : 'Unknown',
      role: service['role-title'],
      startDate: formatDate(service['start-date']),
      endDate: formatDate(service['end-date'])
    }));
  }
  return [];
}

function formatDate(date) {
  if (date && date.year) {
    const year = date.year.value;
    const month = date.month ? date.month.value.padStart(2, '0') : '01';
    const day = date.day ? date.day.value.padStart(2, '0') : '01';
    return `${year}-${month}-${day}`;
  }
  return null;
}

function makeRequest(url, options) {
  return new Promise((resolve, reject) => {
    https.get(url, options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          reject(new Error('Failed to parse response: ' + e.message));
        }
      });
    }).on('error', reject);
  });
}

module.exports = fetchOrcidData;
