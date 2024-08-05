/**
 * @fileoverview Main server file for the Enhanced ORCID Institutional Dashboard
 * @author Original: Owen Stephens, Enhancements: [Your Name]
 * @requires express
 * @requires node-fetch
 * @requires apicache
 * @requires express-rate-limit
 * @requires dotenv
 * @requires path
 */

require('dotenv').config();
const express = require('express');
const apicache = require('apicache');
const rateLimit = require('express-rate-limit');
const path = require('path');
const { enrichWithRepositoryData, enrichWorkWithDOIMetadata } = require('./dataEnrichment');
const { analyzeCollaborationPatterns, identifyKeyResearchers } = require('./analytics');
const APIIntegration = require('./APIIntegration');
const Exporter = require('./Exporter');

// Use global fetch if available, otherwise use a dynamic import for node-fetch
const fetchImplementation = globalThis.fetch || (async (...args) => {
  const { default: fetch } = await import('node-fetch');
  return fetch(...args);
});

const app = express();
const cache = apicache.middleware;
const apiIntegration = new APIIntegration();


/**
 * @constant {string} ORCID_API_URL - Base URL for the ORCID API
 */
const ORCID_API_URL = process.env.ORCID_API_URL || 'https://pub.orcid.org/v3.0';

/**
 * @constant {number} PAGE_SIZE - Number of results to fetch per page
 */
const PAGE_SIZE = parseInt(process.env.PAGE_SIZE) || 1000;

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static('public'));
app.use(express.static(path.join(__dirname, 'orcid-dashboard-frontend/build')));
app.set('view engine', 'ejs');

/**
 * Rate limiter to prevent API abuse
 */
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});

// Apply rate limiter to all requests
app.use(limiter);



async function fetchWithRetry(url, options = {}, retries = 5, backoff = 300) {
  try {
    const response = await fetch(url, options);
    if (response.ok) {
      return response;
    }
    if (response.status === 503) {
      console.log(`Service Unavailable (503) for ${url}. Retrying after ${backoff}ms`);
      await new Promise(resolve => setTimeout(resolve, backoff));
      return fetchWithRetry(url, options, retries - 1, backoff * 2);
    }
    throw new Error(`HTTP error! status: ${response.status}`);
  } catch (error) {
    if (retries > 0) {
      console.log(`Retrying fetch for ${url}. Attempts left: ${retries - 1}`);
      await new Promise(resolve => setTimeout(resolve, backoff));
      return fetchWithRetry(url, options, retries - 1, backoff * 2);
    }
    throw error;
  }
}

/**
 * Main search route
 * @name get/api/search
 * @function
 * @async
 * @param {string} req.query - Query parameters for the search
 * @param {string} req.query.ringgold - Ringgold ID for institution search
 * @param {string} req.query.grid - GRID ID for institution search
 * @param {string} req.query.emaildomain - Email domain for affiliation search
 * @param {string} req.query.orgname - Organization name for search
 * @returns {Object} JSON response with ORCID data and analytics
 */
app.get('/api/search', cache('2 hours'), async function (req, res) {
  try {
    const query = buildQuery(req.query);
    if (query.length > 0) {
      const orcidsList = await fetchOrcids(query);
      console.log(`Found ${orcidsList.length} ORCID IDs`);
      
      const enrichedData = await Promise.all(orcidsList.map(async (orcidData) => {
        if (!orcidData || !orcidData['orcid-identifier'] || !orcidData['orcid-identifier'].path) {
          return null;
        }
        try {
          const orcid = orcidData['orcid-identifier'].path;
          console.log(`Processing ORCID: ${orcid}`);
          let orcidProfile = await fetchOrcidProfile(orcid);
          
          try {
            orcidProfile = await enrichWithRepositoryData(orcidProfile, process.env.REPOSITORY_API_URL);
          } catch (repoError) {
            console.error(`Error enriching with repository data for ORCID ${orcid}:`, repoError);
            // Continue with the original profile if repository enrichment fails
          }
          
          if (orcidProfile.works) {
            orcidProfile.works = await Promise.all(orcidProfile.works.map(async (work) => {
              try {
                return await enrichWorkWithDOIMetadata(work);
              } catch (doiError) {
                console.error(`Error enriching work with DOI metadata for ORCID ${orcid}:`, doiError);
                return work;
              }
            }));
          } else {
            orcidProfile.works = [];
          }
          
          return await apiIntegration.enrichOrcidData(orcidProfile);
        } catch (error) {
          console.error(`Error processing data for ORCID ${orcidData['orcid-identifier'].path}:`, error);
          return null;
        }
      }));

      const validEnrichedData = enrichedData.filter(data => data !== null);
      
      const collaborationPatterns = analyzeCollaborationPatterns(validEnrichedData);
      const keyResearchers = identifyKeyResearchers(validEnrichedData).slice(0, 10);
      
      res.json({
        orcidData: validEnrichedData,
        institutionName: req.query.orgname || 'Your Institution',
        analytics: {
          collaborationPatterns,
          keyResearchers
        }
      });
    } else {
      res.status(400).json({ error: 'Invalid query parameters' });
    }
  } catch (error) {
    console.error('Error in search route:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Builds a query string from request parameters
 * @function
 * @param {Object} params - Request query parameters
 * @returns {string} Constructed query string
 */
function buildQuery(params) {
  const queryParts = [];
  if (params.ringgold) {
    queryParts.push(...params.ringgold.split("|").map(q => `ringgold-org-id:${q}`));
  }
  if (params.grid) {
    queryParts.push(...params.grid.split("|").map(q => `grid-org-id:${q}`));
  }
  if (params.emaildomain) {
    queryParts.push(...params.emaildomain.split("|").map(q => `email:*@${q}`));
  }
  if (params.orgname) {
    queryParts.push(...params.orgname.split("|").map(q => `affiliation-org-name:%22${encodeURI(q)}%22`));
  }
  return queryParts.join("%20OR%20");
}

/**
 * Fetches ORCID profiles based on the query
 * @async
 * @function
 * @param {string} query - The search query
 * @returns {Array} Array of ORCID profiles
 */
async function fetchOrcids(query) {
  let orcidsList = [];
  let start = 0;
  let total;

  do {
    const url = `${ORCID_API_URL}/search/?q=${query}&start=${start}&rows=${PAGE_SIZE}`;
    console.log(`Fetching ORCID IDs from: ${url}`);
    const response = await fetchImplementation(url, {
      headers: { 'Accept': 'application/vnd.orcid+json' }
    });
    const data = await response.json();
    total = data['num-found'];
    console.log(`Found ${data.result.length} ORCID IDs in this batch. Total: ${total}`);
    orcidsList.push(...data.result);
    start += PAGE_SIZE;
  } while (start < total && start < 11000);

  return orcidsList;
}


/**
 * Fetches a single ORCID profile
 * @async
 * @function
 * @param {string} orcid - The ORCID identifier
 * @returns {Object} ORCID profile data
 */
async function fetchOrcids(query) {
  let orcidsList = [];
  let start = 0;
  let total;

  do {
    const url = `${ORCID_API_URL}/search/?q=${query}&start=${start}&rows=${PAGE_SIZE}`;
    console.log(`Fetching ORCID IDs from: ${url}`);
    const response = await fetchImplementation(url, {
      headers: { 'Accept': 'application/vnd.orcid+json' }
    });
    const data = await response.json();
    total = data['num-found'];
    console.log(`Found ${data.result.length} ORCID IDs in this batch. Total: ${total}`);
    orcidsList.push(...data.result);
    start += PAGE_SIZE;
  } while (start < total && start < 11000);

  return orcidsList;
}


app.get('/api/export/:format', async (req, res) => {
  try {
    const query = buildQuery(req.query);
    const orcidsList = await fetchOrcids(query);
    const enrichedData = await Promise.all(orcidsList.map(async orcidData => {
      const orcid = orcidData['orcid-identifier'].path;
      const orcidProfile = await fetchOrcidProfile(orcid);
      return apiIntegration.enrichOrcidData(orcidProfile);
    }));

    const validEnrichedData = enrichedData.filter(data => data !== null);

    const exporter = new Exporter(validEnrichedData);

    
    const { format } = req.params;
    let result;
    let contentType;
    let fileExtension;

    switch (format) {
      case 'csv':
        result = await exporter.toCSV();
        contentType = 'text/csv';
        fileExtension = 'csv';
        break;
      case 'excel':
        result = await exporter.toExcel();
        contentType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
        fileExtension = 'xlsx';
        break;
      case 'json':
        result = exporter.toJSON();
        contentType = 'application/json';
        fileExtension = 'json';
        break;
      case 'pdf':
        result = await exporter.toPDF();
        contentType = 'application/pdf';
        fileExtension = 'pdf';
        break;
      default:
        throw new Error('Unsupported format');
    }

    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Disposition', `attachment; filename=orcid_data.${fileExtension}`);
    res.send(result);
  } catch (error) {
    console.error('Export error:', error);
    res.status(500).send('Export failed: ' + error.message);
  }
});



// The "catchall" handler: for any request that doesn't
// match one above, send back React's index.html file.
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'orcid-dashboard-frontend/build', 'index.html'));
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
