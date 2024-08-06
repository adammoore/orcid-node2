import React, { useState, useCallback } from 'react';
import { QueryClient, QueryClientProvider, useQuery } from 'react-query';
import CombinedSearch from './CombinedSearch';
import InstitutionalDashboard from './components/InstitutionalDashboard';
import AuthorList from './components/AuthorList';
import WorksList from './components/WorksList';
import EnrichmentReport from './EnrichmentReport';
import Loading from './Loading';
import { exportToFile } from './exportUtils';
import { Alert } from './Alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './Tabs';
import { Button } from './Button';
import './App.css';

const queryClient = new QueryClient();

function AppContent() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedAuthor, setSelectedAuthor] = useState(null);

  const { data: orcidData, error, isLoading } = useQuery(
    ['orcidData', searchQuery],
    () => fetch(`/api/search?q=${encodeURIComponent(searchQuery)}`).then(res => res.json()),
    { enabled: !!searchQuery }
  );

  const institutionName = searchQuery.match(/orgname=([^&]+)/)?.[1] || '';

  const handleSearch = (query) => {
    setSearchQuery(query);
  };

  const handleExport = useCallback((format) => {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `orcid_export_${timestamp}`;
    exportToFile(orcidData, format, filename);
  }, [orcidData]);

  return (
    <div className="App p-4 max-w-7xl mx-auto">
      <h1 className="text-3xl font-bold mb-6 text-center">ORCID Institutional Dashboard</h1>
      <CombinedSearch onSearch={handleSearch} />
      
      {isLoading && <Loading message="Fetching ORCID data..." />}
      
      {error && (
        <Alert variant="destructive" className="my-4">
          <h2>Error</h2>
          <p>{error.message}</p>
        </Alert>
      )}
      
      {orcidData && orcidData.length > 0 && (
        <>
          <div className="export-buttons my-4 flex flex-wrap gap-2">
            {['json', 'csv', 'excel', 'pdf'].map(format => (
              <Button key={format} onClick={() => handleExport(format)} variant="outline" size="sm">
                Export {format.toUpperCase()}
              </Button>
            ))}
          </div>
          
          <Tabs defaultValue="dashboard" className="my-6">
            <TabsList>
              <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
              <TabsTrigger value="authors">Authors</TabsTrigger>
              <TabsTrigger value="works">Works</TabsTrigger>
              <TabsTrigger value="enrichment">Enrichment Report</TabsTrigger>
            </TabsList>
            
            <TabsContent value="dashboard">
              <InstitutionalDashboard orcidData={orcidData} institutionName={institutionName} />
            </TabsContent>
            
            <TabsContent value="authors">
              <AuthorList 
                authors={orcidData} 
                onAuthorSelect={setSelectedAuthor}
                selectedAuthor={selectedAuthor}
              />
            </TabsContent>
            
            <TabsContent value="works">
              <WorksList works={orcidData.flatMap(author => author.works)} />
            </TabsContent>
            
            <TabsContent value="enrichment">
              <EnrichmentReport orcidData={orcidData} />
            </TabsContent>
          </Tabs>
        </>
      )}
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
