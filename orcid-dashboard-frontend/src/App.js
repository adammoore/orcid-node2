/**
 * @file App.js
 * @description Main component for the ORCID Institutional Dashboard
 * @author Adam Vials Moore
 * @license Apache-2.0
 */

import React, { useState } from 'react';
import { QueryClient, QueryClientProvider, useQuery } from 'react-query';
import CombinedSearch from './CombinedSearch';
import InstitutionalDashboard from './components/InstitutionalDashboard';
import AuthorModal from './AuthorModal';
import EnrichmentReport from './EnrichmentReport';
import Loading from './Loading';
import { exportToFile } from './exportUtils';
import swal from 'sweetalert';

import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import './App.css';

// Create a client for React Query
const queryClient = new QueryClient();

/**
 * AppContent component containing the main application logic
 */
function AppContent() {
  // State for search query and selected author
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedAuthor, setSelectedAuthor] = useState(null);

  // Use React Query to fetch ORCID data
  const { data: orcidData, error, isLoading } = useQuery(
    ['orcidData', searchQuery],
    () => fetch(`/api/search?q=${encodeURIComponent(searchQuery)}`).then(res => res.json()),
    { enabled: !!searchQuery } // Only run the query if there's a search query
  );

  // Extract institution name from the search query
  const institutionName = searchQuery.match(/orgname=([^&]+)/)?.[1] || '';

  /**
   * Handle search query submission
   * @param {string} query - The search query
   */
  const handleSearch = (query) => {
    setSearchQuery(query);
  };

  /**
   * Handle data export
   * @param {string} format - The export format
   */
  const handleExport = (format) => {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `orcid_export_${timestamp}`;
    exportToFile(orcidData, format, filename);
  };

  return (
    <div className="App">
      <h1 className="text-2xl font-bold mb-4">ORCID Institutional Dashboard</h1>

      {/* Search component */}
      <CombinedSearch onSearch={handleSearch} />

      {/* Loading indicator */}
      {isLoading && <Loading message="Fetching ORCID data..." />}

      {/* Error display */}
      {error && (
        swal('Error!',error.message,'success')
      )}

      {/* Main content when data is loaded */}
      {orcidData && orcidData.length > 0 && (
        <>
          {/* Export buttons */}
          <div className="export-buttons">
            <TooltipProvider>
              {['csv', 'excel', 'json', 'pdf', 'bibtex', 'ris'].map(format => (
                <Tooltip key={format}>
                  <TooltipTrigger asChild>
                    <button onClick={() => handleExport(format)} className="btn-export">
                      Export {format.toUpperCase()}
                    </button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Export data in {format.toUpperCase()} format</p>
                  </TooltipContent>
                </Tooltip>
              ))}
            </TooltipProvider>
          </div>

          {/* Dashboard component */}
          <InstitutionalDashboard orcidData={orcidData} institutionName={institutionName} />

          {/* Enrichment report */}
          <EnrichmentReport orcidData={orcidData} />

          {/* Author list */}
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
                    <button onClick={() => setSelectedAuthor(author)} className="text-blue-500 hover:underline">
                      View {author.works.length} works
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Author modal */}
          {selectedAuthor && (
            <AuthorModal
              author={selectedAuthor}
              onClose={() => setSelectedAuthor(null)}
            />
          )}
        </>
      )}
    </div>
  );
}

/**
 * Main App component
 * Wraps the AppContent with QueryClientProvider for React Query
 */
function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AppContent />
    </QueryClientProvider>
  );
}

export default App;
