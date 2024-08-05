const ExcelJS = require('exceljs');
const PDFDocument = require('pdfkit');

class Exporter {
  constructor(data) {
    this.data = data;
  }

  async toCSV() {
    let csv = 'ORCID,Name,LastUpdated,Employments,Educations,WorkCount\n';
    this.data.forEach(item => {
      csv += `${item.orcid || ''},${item.name || ''},${item.lastUpdated || ''},"${(item.employments || []).join('; ')}","${(item.educations || []).join('; ')}",${item.workCount || 0}\n`;
    });
    return csv;
  }

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
        workCount: item.workCount || 0
      });
    });

    return await workbook.xlsx.writeBuffer();
  }

  toJSON() {
    return JSON.stringify(this.data, null, 2);
  }

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
      doc.text(`Work Count: ${item.workCount || 0}`);
      doc.moveDown();
    });

    doc.end();

    return new Promise((resolve) => {
      doc.on('end', () => {
        resolve(Buffer.concat(buffers));
      });
    });
  }

  toBibTeX() {
    let bibtex = '';
    this.data.forEach(profile => {
      profile.works.forEach(work => {
        bibtex += `@article{${work.doi || 'unknown'},\n`;
        bibtex += `  title = {${work.title}},\n`;
        bibtex += `  author = {${profile.name}},\n`;
        bibtex += `  year = {${work.year}},\n`;
        bibtex += `  journal = {${work.journal || 'Unknown'}},\n`;
        bibtex += `  doi = {${work.doi || 'Unknown'}}\n`;
        bibtex += '}\n\n';
      });
    });
    return bibtex;
  }

  toRIS() {
    let ris = '';
    this.data.forEach(profile => {
      profile.works.forEach(work => {
        ris += 'TY  - JOUR\n';
        ris += `TI  - ${work.title}\n`;
        ris += `AU  - ${profile.name}\n`;
        ris += `PY  - ${work.year}\n`;
        ris += `JO  - ${work.journal || 'Unknown'}\n`;
        ris += `DO  - ${work.doi || 'Unknown'}\n`;
        ris += 'ER  - \n\n';
      });
    });
    return ris;
  }
}

module.exports = Exporter;
