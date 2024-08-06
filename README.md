# ORCID Institutional Dashboard

## Overview

The ORCID Institutional Dashboard is an advanced tool for visualizing and analyzing ORCID data affiliated with specific organizations or linked to specific email domains. This application provides comprehensive insights into research output, collaboration networks, and institutional affiliations.

## Recent Updates

- Improved export functionality for CSV, Excel, JSON, PDF, BibTeX, and RIS formats
- Enhanced presentation of works with selectable BibTeX style in the author modal
- Refactored data enrichment process to focus on ORCID, DataCite, and Crossref data
- Implemented a more efficient caching system using SQLite for improved portability
- Added an enrichment report to highlight potential data quality improvements

## Features

- Flexible search by institution, email domain, or custom queries
- Data visualization including work distribution by type and works by year
- Detailed author profiles with selectable and exportable works
- Bulk data export in multiple formats
- Enrichment report for identifying data quality improvement opportunities

## Installation

1. Clone the repository
2. Run `npm install` to install dependencies
3. Create a `.env` file and set required environment variables
4. Run `npm start` to start the server

## Usage

1. Access the dashboard through your web browser
2. Use the search functionality to query ORCID data
3. Explore visualizations and author profiles
4. Export data in your preferred format
5. Review the enrichment report for data quality insights

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License.

## Acknowledgements

This project is based on the original orcid-node repository created by Owen Stephens and has been significantly enhanced with additional features and improvements.
