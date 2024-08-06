/**
 * @file server.js
 * @description Main server file for the ORCID Institutional Dashboard
 * @author Adam Vials Moore
 * @license Apache-2.0
 */

require('dotenv').config();
const express = require('express');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();
const Exporter = require('./Exporter');
const enrichOrcidData  = require('./dataEnrichment');
const APIIntegration = require('./APIIntegration');
const analytics = require('./analytics');
const fetchOrcidData = require('./fetchOrcidData');


const app = express();
const PORT = process.env.PORT || 4000;

// SQLite database setup
const db = new sqlite3.Database('./orcid_cache.sqlite', (err) => {
  if (err) {
    console.error('Error opening database', err);
  } else {
    console.log('Connected to the SQLite database.');
    db.run(`CREATE TABLE IF NOT EXISTS orcid_cache (
      query TEXT PRIMARY KEY,
      data TEXT NOT NULL,
      timestamp INTEGER NOT NULL
    )`);
  }
});

const apiIntegration = new APIIntegration();

// Serve static files from the React app build directory
app.use(express.static(path.join(__dirname, 'orcid-dashboard-frontend/build')));

app.use(express.json());

/**
 * @route GET /api/search
 * @description Search for ORCID data based on query parameters
 * @param {string} q - Search query (e.g., ringgold=123456&emaildomain=example.com)
 */
app.get('/api/search', async (req, res) => {
  try {
    const query = req.query.q;
    if (!query) {
      return res.status(400).json({ error: 'Search query is required' });
    }

    let data = await getCachedData(query);

    if (!data) {
      data = await fetchOrcidData(query);
      if (data.length === 0) {
        console.log(`No results found for query: ${query}`);
        return res.status(404).json({ message: 'No results found' });
      }
      await cacheData(query, data);
    }

    res.json(data);
  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({ error: 'An error occurred while fetching ORCID data' });
  }
});

/**
 * @route GET /api/export/:format
 * @description Export ORCID data in various formats
 * @param {string} format - Export format (csv, excel, json, pdf, bibtex, ris)
 * @param {string} q - Search query
 */
app.get('/api/export/:format', async (req, res) => {
  try {
    const { format } = req.params;
    const { q } = req.query;
    const data = await getCachedData(q) || await fetchOrcidData(q);
    
    const exporter = new Exporter(data);
    let result, contentType, fileExtension;

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
      case 'bibtex':
        result = exporter.toBibTeX();
        contentType = 'application/x-bibtex';
        fileExtension = 'bib';
        break;
      case 'ris':
        result = exporter.toRIS();
        contentType = 'application/x-research-info-systems';
        fileExtension = 'ris';
        break;
      default:
        throw new Error('Unsupported format');
    }

    const timestamp = new Date().toISOString().replace(/[:.-]/g, '');
    const filename = `orcid_export_${q.replace(/[^a-z0-9]/gi, '_')}_${timestamp}.${fileExtension}`;

    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Disposition', `attachment; filename=${filename}`);
    res.send(result);
  } catch (error) {
    console.error('Export error:', error);
    res.status(500).send('Export failed: ' + error.message);
  }
});

/**
 * @route GET /api/analytics
 * @description Get advanced analytics for ORCID data
 * @param {string} q - Search query
 */
app.get('/api/analytics', async (req, res) => {
  try {
    const { q } = req.query;
    const data = await getCachedData(q) || await fetchOrcidData(q);
    const enrichedData = await Promise.all(data.map(apiIntegration.enrichOrcidData));

    const collaborationPatterns = analytics.analyzeCollaborationPatterns(enrichedData);
    const keyResearchers = analytics.identifyKeyResearchers(enrichedData);

    res.json({ collaborationPatterns, keyResearchers });
  } catch (error) {
    console.error('Analytics error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'orcid-dashboard-frontend/build', 'index.html'));
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

/**
 * Cache ORCID data in SQLite database
 * @param {string} query - Search query
 * @param {Array} data - ORCID data to cache
 */
async function cacheData(query, data) {
  const stmt = db.prepare('INSERT OR REPLACE INTO orcid_cache (query, data, timestamp) VALUES (?, ?, ?)');
  stmt.run(query, JSON.stringify(data), Date.now());
  stmt.finalize();
}

/**
 * Retrieve cached ORCID data from SQLite database
 * @param {string} query - Search query
 * @returns {Promise<Array|null>} Cached ORCID data or null if not found
 */
async function getCachedData(query) {
  return new Promise((resolve, reject) => {
    db.get('SELECT data, timestamp FROM orcid_cache WHERE query = ?', [query], (err, row) => {
      if (err) {
        reject(err);
      } else if (row && (Date.now() - row.timestamp < 24 * 60 * 60 * 1000)) {
        resolve(JSON.parse(row.data));
      } else {
        resolve(null);
      }
    });
  });
}
