/**
 * @file db.js
 * @description SQLite database manager for caching ORCID data
 * @requires sqlite3
 */

const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.resolve(__dirname, 'orcid_cache.sqlite');

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error opening database', err);
  } else {
    console.log('Connected to the SQLite database.');
    db.run(`CREATE TABLE IF NOT EXISTS orcid_cache (
      query TEXT PRIMARY KEY,
      data TEXT NOT NULL,
      last_updated INTEGER NOT NULL
    )`);
  }
});

/**
 * @function cacheOrcidData
 * @param {string} query - Query used to fetch data
 * @param {Array} data - ORCID data to cache
 * @returns {Promise} Resolves when data is cached
 */
function cacheOrcidData(query, data) {
  return new Promise((resolve, reject) => {
    const stmt = db.prepare('INSERT OR REPLACE INTO orcid_cache (query, data, last_updated) VALUES (?, ?, ?)');
    stmt.run(query, JSON.stringify(data), Date.now(), (err) => {
      if (err) reject(err);
      else resolve();
    });
    stmt.finalize();
  });
}

/**
 * @function getCachedData
 * @param {string} query - Query to retrieve cached data
 * @returns {Promise<Array|null>} Resolves with cached ORCID data or null if not found
 */
function getCachedData(query) {
  return new Promise((resolve, reject) => {
    db.get('SELECT data, last_updated FROM orcid_cache WHERE query = ?', [query], (err, row) => {
      if (err) {
        reject(err);
      } else if (row) {
        const now = Date.now();
        const cacheAge = now - row.last_updated;
        if (cacheAge < 24 * 60 * 60 * 1000) { // 24 hours
          resolve(JSON.parse(row.data));
        } else {
          resolve(null);
        }
      } else {
        resolve(null);
      }
    });
  });
}

/**
 * @function closeDatabase
 * @returns {Promise} Resolves when the database connection is closed
 */
function closeDatabase() {
  return new Promise((resolve, reject) => {
    db.close((err) => {
      if (err) reject(err);
      else resolve();
    });
  });
}

module.exports = { cacheOrcidData, getCachedData, closeDatabase };
