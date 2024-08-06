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
const { fetchOrcidData, enrichOrcidData } = require('./dataEnrichment');

const app = express();
const PORT = process.env.PORT || 3000;

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

/**
 * @function cacheData
 * @description Caches ORCID data in SQLite database
 * @param {string} query - Search query
 * @param {Array} data - ORCID data to cache
 */
async function cacheData(query, data) {
  const stmt = db.prepare('INSERT OR REPLACE INTO orcid_cache (query, data, timestamp) VALUES (?, ?, ?)');
  stmt.run(query, JSON.stringify(data), Date.now());
  stmt.finalize();
}

/**
 * @function getCachedData
 * @description Retrieves cached ORCID data from SQLite database
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

app.use(express.static(path.join(__dirname, 'public')));

app.get('/api/search', async (req, res) => {
  try {
    const query = req.query.q;
    let data = await getCachedData(query);

    if (!data) {
      const rawData = await fetchOrcidData(query);
      data = await Promise.all(rawData.map(enrichOrcidData));
      await cacheData(query, data);
    }

    res.json(data);
  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({ error: error.message });
  }
});

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

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
