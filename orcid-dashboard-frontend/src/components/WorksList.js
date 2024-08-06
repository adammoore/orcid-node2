import React from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './Table';

const WorksList = ({ works }) => {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Title</TableHead>
          <TableHead>Type</TableHead>
          <TableHead>Publication Date</TableHead>
          <TableHead>DOI</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {works.map((work, index) => (
          <TableRow key={index}>
            <TableCell>{work.title}</TableCell>
            <TableCell>{work.type}</TableCell>
            <TableCell>{work.publicationDate || 'N/A'}</TableCell>
            <TableCell>
              {work.doi ? (
                <a 
                  href={`https://doi.org/${work.doi}`} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline"
                >
                  {work.doi}
                </a>
              ) : 'N/A'}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
};

export default WorksList;
