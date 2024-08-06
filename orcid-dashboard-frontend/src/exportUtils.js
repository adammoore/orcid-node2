/**
 * @file exportUtils.js
 * @description Utility functions for exporting data on the client side
 */

/**
 * @function exportToFile
 * @param {Array} data - The data to export
 * @param {string} format - The export format (csv, excel, json, pdf, bibtex, ris)
 */
export function exportToFile(data, format) {
  let content, filename, mimeType;

  switch (format) {
    case 'csv':
      content = convertToCSV(data);
      filename = 'export.csv';
      mimeType = 'text/csv;charset=utf-8;';
      break;
    case 'json':
      content = JSON.stringify(data, null, 2);
      filename = 'export.json';
      mimeType = 'application/json;charset=utf-8;';
      break;
    case 'bibtex':
      content = convertToBibTeX(data);
      filename = 'export.bib';
      mimeType = 'application/x-bibtex;charset=utf-8;';
      break;
    case 'ris':
      content = convertToRIS(data);
      filename = 'export.ris';
      mimeType = 'application/x-research-info-systems;charset=utf-8;';
      break;
    default:
      console.error('Unsupported export format');
      return;
  }

  const blob = new Blob([content], { type: mimeType });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  link.click();
  URL.revokeObjectURL(link.href);
}

/**
 * @function convertToCSV
 * @param {Array} data - The data to convert to CSV
 * @returns {string} CSV formatted string
 */
function convertToCSV(data) {
  const header = Object.keys(data[0]).join(',') + '\n';
  const rows = data.map(obj => Object.values(obj).join(','));
  return header + rows.join('\n');
}

/**
 * @function convertToBibTeX
 * @param {Array} data - The data to convert to BibTeX
 * @returns {string} BibTeX formatted string
 */
function convertToBibTeX(data) {
  return data.map(item => {
    return `@article{${item.doi || 'unknown'},
  title = {${item.title}},
  author = {${item.author}},
  year = {${item.year}},
  journal = {${item.journal || 'Unknown'}},
  doi = {${item.doi || 'Unknown'}}
}`;
  }).join('\n\n');
}

/**
 * @function convertToRIS
 * @param {Array} data - The data to convert to RIS
 * @returns {string} RIS formatted string
 */
function convertToRIS(data) {
  return data.map(item => {
    return `TY  - JOUR
TI  - ${item.title}
AU  - ${item.author}
PY  - ${item.year}
JO  - ${item.journal || 'Unknown'}
DO  - ${item.doi || 'Unknown'}
ER  - `;
  }).join('\n\n');
}

export function exportToBibTeX(work) {
  return convertToBibTeX([work]);
}

export function exportToRIS(work) {
  return convertToRIS([work]);
}
