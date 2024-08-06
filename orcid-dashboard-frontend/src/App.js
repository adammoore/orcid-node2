/**
 * @file App.js
 * @description Main component for the ORCID Institutional Dashboard
 * @author Adam Vials Moore
 * @license Apache-2.0
 */

import * as React from 'react';
import { QueryClient, QueryClientProvider, useQuery } from 'react-query';
import CombinedSearch from './CombinedSearch';
import InstitutionalDashboard from './components/InstitutionalDashboard';
import AuthorModal from './AuthorModal';
import EnrichmentReport from './EnrichmentReport';
import Loading from './Loading';
import { exportToFile } from './exportUtils';
import { Alert, AlertDescription, AlertTitle } from './Alert';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './Tooltip';
import { Card, CardContent, CardHeader, CardTitle } from './Card';
import { Button } from './Button';
import './App.css';

// Create a client for React Query
const queryClient = new QueryClient();

function AppContent() {
  const [searchQuery, setSearchQuery] = React.useState('');
  const [selectedAuthor, setSelectedAuthor] = React.useState(null);

  const { data: orcidData, error, isLoading } = useQuery(
    ['orcidData', searchQuery],
    () => fetch(`/api/search?q=${encodeURIComponent(searchQuery)}`).then(res => res.json()),
    { enabled: !!searchQuery }
  );

  const institutionName = searchQuery.match(/orgname=([^&]+)/)?.[1] || '';

  const handleSearch = (query) => {
    setSearchQuery(query);
  };

  const handleExport = (format) => {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `orcid_export_${timestamp}`;
    exportToFile(orcidData, format, filename);
  };

  return (
    <div className="App">
      <Card>
        <CardHeader>
          <CardTitle>ORCID Institutional Dashboard</CardTitle>
        </CardHeader>
        <CardContent>
          <CombinedSearch onSearch={handleSearch} />
          {isLoading && <Loading message="Fetching ORCID data..." />}
          {error && (
            <Alert variant="destructive">
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error.message}</AlertDescription>
            </Alert>
          )}
          {orcidData && orcidData.length > 0 && (
            <>
              <div className="export-buttons">
                <TooltipProvider>
                  {['csv', 'excel', 'json', 'pdf', 'bibtex', 'ris'].map(format => (
                    <Tooltip key={format}>
                      <TooltipTrigger asChild>
                        <Button onClick={() => handleExport(format)} variant="outline" size="sm">
                          Export {format.toUpperCase()}
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Export data in {format.toUpperCase()} format</p>
                      </TooltipContent>
                    </Tooltip>
                  ))}
                </TooltipProvider>
              </div>
              <InstitutionalDashboard orcidData={orcidData} institutionName={institutionName} />
              <EnrichmentReport orcidData={orcidData} />
              <table className="w-full mt-4">
                <thead>
                  <tr>
                    <th className="text-left">ORCID</th>
                    <th className="text-left">Name</th>
                    <th className="text-left">Works</th>
                  </tr>
                </thead>
                <tbody>
                  {orcidData.map(author => (
                    <tr key={author.orcid}>
                      <td>{author.orcid}</td>
                      <td>{author.name}</td>
                      <td>
                        <Button onClick={() => setSelectedAuthor(author)} variant="link">
                          View {author.works.length} works
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {selectedAuthor && (
                <AuthorModal
                  author={selectedAuthor}
                  onClose={() => setSelectedAuthor(null)}
                />
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AppContent />
    </QueryClientProvider>
  );
}

export default App;
