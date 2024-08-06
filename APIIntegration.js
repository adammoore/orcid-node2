const https = require('https');
const Bottleneck = require('bottleneck');

const limiter = new Bottleneck({
  minTime: 1000 // Ensure at least 1 second between each request
});

class APIIntegration {
  constructor() {
    this.ROR_API = 'https://api.ror.org/organizations';
    this.DATACITE_API = 'https://api.datacite.org/dois';
    this.CROSSREF_API = 'https://api.crossref.org/works';
  }

  fetchData(url) {
    return limiter.schedule(() => new Promise((resolve, reject) => {
      https.get(url, (res) => {
        let data = '';
        res.on('data', (chunk) => {
          data += chunk;
        });
        res.on('end', () => {
          try {
            const parsedData = JSON.parse(data);
            resolve(parsedData);
          } catch (error) {
            console.error('Failed to parse API response:', error);
            console.error('Raw response:', data);
            reject(new Error('Failed to parse API response'));
          }
        });
      }).on('error', (err) => {
        console.error('Error fetching data:', err);
        reject(err);
      });
    }));
  }

  async fetchRORData(organizationName) {
    try {
      const data = await this.fetchData(`${this.ROR_API}?query=${encodeURIComponent(organizationName)}`);
      return data.items && data.items[0] ? data.items[0] : null;
    } catch (error) {
      console.error('Error fetching ROR data:', error);
      return null;
    }
  }

  async fetchDataCiteDOIs(orcid) {
    try {
      const data = await this.fetchData(`${this.DATACITE_API}?query=creators.nameIdentifiers.nameIdentifier:${orcid}`);
      return data.data || [];
    } catch (error) {
      console.error('Error fetching DataCite DOIs:', error);
      return [];
    }
  }

  async fetchCrossrefWorks(orcid) {
    try {
      const data = await this.fetchData(`${this.CROSSREF_API}?filter=orcid:${orcid}`);
      return data.message && data.message.items ? data.message.items : [];
    } catch (error) {
      console.error('Error fetching Crossref works:', error);
      return [];
    }
  }

  async enrichOrcidData(orcidProfile) {
    if (!orcidProfile || typeof orcidProfile !== 'object') {
      console.error('Invalid ORCID profile provided:', orcidProfile);
      return null;
    }

    const enrichedData = {
      orcid: orcidProfile['orcid-identifier']?.path,
      name: this.getName(orcidProfile),
      lastUpdated: this.getLastUpdated(orcidProfile),
      employments: this.getEmployments(orcidProfile),
      educations: this.getEducations(orcidProfile),
      works: this.getWorks(orcidProfile),
      workCount: this.getWorkCount(orcidProfile)
    };

    return enrichedData;
  }

  async getEnrichedWorks(orcidProfile) {
    const works = this.getWorks(orcidProfile);
    return Promise.all(works.map(async (work) => {
      if (work.doi) {
        try {
          const [crossrefData, dataCiteData] = await Promise.all([
            this.fetchCrossrefWorks(work.doi),
            this.fetchDataCiteDOIs(work.doi)
          ]);
          return {
            ...work,
            crossrefData,
            dataCiteData
          };
        } catch (error) {
          console.error(`Error enriching work ${work.doi}:`, error);
        }
      }
      return work;
    }))};
  

  getName(profile) {
    return profile.person?.name?.['given-names']?.value + ' ' + profile.person?.name?.['family-name']?.value || 'N/A';
  }

  getLastUpdated(profile) {
    return new Date(profile.history?.['last-modified-date']?.value).toISOString().split('T')[0] || 'N/A';
  }

  getEmployments(profile) {
    return profile['activities-summary']?.employments?.['affiliation-group']?.map(group => {
      const employment = group.summaries[0]['employment-summary'];
      return `${employment.organization.name}: ${employment['role-title'] || 'N/A'}`;
    }) || [];
  }

  getEducations(profile) {
    return profile['activities-summary']?.educations?.['affiliation-group']?.map(group => {
      const education = group.summaries[0]['education-summary'];
      return `${education.organization.name}: ${education['role-title'] || 'N/A'}`;
    }) || [];
  }

  getWorks(profile) {
    return profile['activities-summary']?.works?.group?.map(group => {
      const work = group['work-summary'][0];
      return {
        title: work.title?.title?.value || 'N/A',
        type: work.type || 'N/A',
        year: work['publication-date']?.year?.value || 'N/A'
      };
    }) || [];
  }

  getWorkCount(profile) {
    return profile['activities-summary']?.works?.group?.length || 0;
  }


  processOriginalData(orcidData) {
    // Process the original ORCID data without enrichment
    const processedData = {
      orcid: orcidData['orcid-identifier'].path,
      name: orcidData.person.name ? 
        `${orcidData.person.name['given-names'].value} ${orcidData.person.name['family-name'].value}` : 
        'Name not provided',
      works: []
    };

    if (orcidData['activities-summary'] && orcidData['activities-summary'].works) {
      processedData.works = orcidData['activities-summary'].works.group.map(work => ({
        title: work['work-summary'][0].title.title.value,
        type: work['work-summary'][0].type,
        year: work['work-summary'][0]['publication-date'] ? 
          work['work-summary'][0]['publication-date'].year.value : 
          'Year not provided'
      }));
    }

    return processedData;
  }
}

module.exports = APIIntegration;
