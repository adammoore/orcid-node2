/**
 * @file Exporter.js
 * @description Handles data export in various formats
 * @author Adam Vials Moore
 * @license Apache-2.0
 */

const ExcelJS = require('exceljs');
const PDFDocument = require('pdfkit');

class Exporter {
  constructor(data) {
    this.data = data;
  }

  /**
   * @method toCSV
   * @description Converts data to CSV format
   * @returns {string} CSV formatted string
   */
  async toCSV() {
    let csv = 'ORCID,Name,LastUpdated,Employments,Educations,WorkCount\n';
    this.data.forEach(item => {
      csv += `"${item.orcid || ''}","${item.name || ''}","${item.lastUpdated || ''}","${(item.employments || []).join('; ')}","${(item.educations || []).join('; ')}","${item.works ? item.works.length : 0}"\n`;
    });
    return csv;
  }

  /**
   * @method toExcel
   * @description Converts data to Excel format
   * @returns {Buffer} Excel file buffer
   */
  async toExcel() {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('ORCID Data');

    worksheet.columns = [
      { header: 'ORCID', key: 'orcid' },
      { header: 'Name', key: 'name' },
      { header: 'Last Updated', key: 'lastUpdated' },
      { header: 'Employments', key: 'employments' },
      { header: 'Educations', key: 'educations' },
      { header: 'Work Count', key: 'workCount' }
    ];

    this.data.forEach(item => {
      worksheet.addRow({
        orcid: item.orcid || '',
        name: item.name || '',
        lastUpdated: item.lastUpdated || '',
        employments: (item.employments || []).join('; '),
        educations: (item.educations || []).join('; '),
        workCount: item.works ? item.works.length : 0
      });
    });

    return await workbook.xlsx.writeBuffer();
  }

  /**
   * @method toJSON
   * @description Converts data to JSON format
   * @returns {string} JSON formatted string
   */
  toJSON() {
    return JSON.stringify(this.data, null, 2);
  }

  /**
   * @method toPDF
   * @description Converts data to PDF format
   * @returns {Buffer} PDF file buffer
   */
  async toPDF() {
    const doc = new PDFDocument();
    let buffers = [];
    doc.on('data', buffers.push.bind(buffers));
    doc.on('end', () => {});

    doc.fontSize(16).text('ORCID Data Export', { align: 'center' });
    doc.moveDown();

    this.data.forEach(item => {
      doc.fontSize(12).text(`ORCID: ${item.orcid || 'N/A'}`);
      doc.fontSize(10).text(`Name: ${item.name || 'N/A'}`);
      doc.text(`Last Updated: ${item.lastUpdated || 'N/A'}`);
      doc.text(`Employments: ${(item.employments || []).join('; ')}`);
      doc.text(`Educations: ${(item.educations || []).join('; ')}`);
      doc.text(`Work Count: ${item.works ? item.works.length : 0}`);
      doc.moveDown();
    });

    doc.end();

    return new Promise((resolve) => {
      doc.on('end', () => {
        resolve(Buffer.concat(buffers));
      });
    });
  }

  /**
   * @method toBibTeX
   * @description Converts data to BibTeX format
   * @returns {string} BibTeX formatted string
   */
  toBibTeX() {
    let bibtex = '';
    this.data.forEach(profile => {
      (profile.works || []).forEach((work, index) => {
        const key = `${profile.name.split(' ').pop().toLowerCase()}${profile.lastUpdated?.slice(0, 4)}${index}`;
        bibtex += `@article{${key},\n`;
        bibtex += `  author = {${profile.name || 'Unknown'}},\n`;
        bibtex += `  title = {${work.title || 'Unknown'}},\n`;
        bibtex += `  year = {${work.year || 'Unknown'}},\n`;
        bibtex += `  journal = {${work.journal || 'Unknown'}},\n`;
        bibtex += `  doi = {${work.doi || 'Unknown'}}\n`;
        bibtex += '}\n\n';
      });
    });
    return bibtex;
  }

  /**
   * @method toRIS
   * @description Converts data to RIS format
   * @returns {string} RIS formatted string
   */
  toRIS() {
    let ris = '';
    this.data.forEach(profile => {
      (profile.works || []).forEach(work => {
        ris += 'TY  - JOUR\n';
        ris += `AU  - ${profile.name || 'Unknown'}\n`;
        ris += `TI  - ${work.title || 'Unknown'}\n`;
        ris += `PY  - ${work.year || 'Unknown'}\n`;
        ris += `JO  - ${work.journal || 'Unknown'}\n`;
        ris += `DO  - ${work.doi || 'Unknown'}\n`;
        ris += 'ER  - \n\n';
      });
    });
    return ris;
  }     
}       
        
module.exports = Exporter;

