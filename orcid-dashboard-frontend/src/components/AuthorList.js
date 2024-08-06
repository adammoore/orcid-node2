import React from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './Table';
import { Button } from '../Button';

const AuthorList = ({ authors, onAuthorSelect, selectedAuthor }) => {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>ORCID</TableHead>
          <TableHead>Name</TableHead>
          <TableHead>Works</TableHead>
          <TableHead>Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {authors.map((author) => (
          <TableRow key={author.orcid}>
            <TableCell>
              <a 
                href={`https://orcid.org/${author.orcid}`} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline"
              >
                {author.orcid}
              </a>
            </TableCell>
            <TableCell>{author.name}</TableCell>
            <TableCell>{author.works.length}</TableCell>
            <TableCell>
              <Button 
                onClick={() => onAuthorSelect(author)} 
                variant="outline" 
                size="sm"
              >
                View Details
              </Button>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
};

export default AuthorList;
