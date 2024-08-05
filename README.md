# ORCID Institutional Dashboard

This application is an enhanced version of a nodejs app for searching and visualizing ORCID data affiliated with specific organizations or linked to specific email domains.

## Origin

This project is based on the original [orcid-node](https://github.com/ostephens/orcid-node) repository created by Owen Stephens. It has been significantly enhanced with additional features and improvements.

## New Features

- Data enrichment from institutional repositories and DOI metadata
- Advanced analytics including collaboration patterns and key researcher identification
- Enhanced visualization of researcher collaboration networks
- Detailed ORCID profile information display
- Multiple export formats (CSV, Excel, JSON, PDF)

## Installation

1. Clone the repository
2. Run `npm install` to install dependencies
3. Create a `.env` file and set your environment variables (e.g., PORT, ORCID_API_URL, REPOSITORY_API_URL)
4. Run `npm start` to start the server

## Usage

1. Select a region (UK or US) and choose an institution from the dropdown, or use the custom query option to search by email domain or affiliation.
2. View the generated visualizations, data tables, and analytics.
3. Use the export buttons to download the data in your preferred format.

## Components

- `server.js`: Main server file handling API requests and data processing
- `App.js`: React frontend component
- `APIIntegration.js`: Handles integration with external APIs (ORCID, ROR, DataCite, Crossref)
- `Exporter.js`: Manages data export in various formats
- `dataEnrichment.js`: Functions for enriching ORCID data
- `analytics.js`: Advanced analytics functions

## Limitations and Considerations

- The ORCID public API has a limit of 11000 results per query
- Data accuracy depends on the completeness and up-to-date status of ORCID profiles
- High volume of API calls may be required for large institutions

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the Apache 2.0 License.

## Acknowledgements

Special thanks to Owen Stephens for the original orcid-node project, and to all contributors who have helped enhance this tool.
