# ORCID Institutional Dashboard

## Overview

The ORCID Institutional Dashboard is a powerful tool for visualizing and analyzing ORCID data affiliated with specific organizations or linked to specific email domains. This application provides insights into researcher collaborations, work distributions, and institutional connections.

## Features

- Search for ORCID profiles by institution, email domain, or custom criteria
- Visualize researcher collaboration networks
- Display work distribution by type and year
- Show top authors and their connections
- Calculate and display collaboration ratios (internal vs external)
- Export data in various formats (CSV, Excel, JSON, PDF, BibTeX, RIS)
- Scalable caching solution for handling large datasets

## Installation

1. Clone the repository:
   ```
   git clone https://github.com/yourusername/orcid-institutional-dashboard.git
   cd orcid-institutional-dashboard
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Set up environment variables:
   Create a `.env` file in the root directory and add the following:
   ```
   PORT=4000
   ORCID_API_URL=https://pub.orcid.org/v3.0
   CROSSREF_API_URL=https://api.crossref.org/works
   DATACITE_API_URL=https://api.datacite.org/dois
   DB_URI=your_database_connection_string
   ```

4. Start the server:
   ```
   npm start
   ```

## Usage

1. Open a web browser and navigate to `http://localhost:4000` (or the port you specified in the .env file).
2. Use the search interface to query ORCID data by institution, email domain, or custom criteria.
3. Explore the visualizations and data presented in the dashboard.
4. Export data in your preferred format using the export buttons.

## API Endpoints

- `GET /api/search`: Search for ORCID profiles
- `GET /api/export/:format`: Export data in various formats (csv, excel, json, pdf, bibtex, ris)
- `GET /api/clear-cache`: Clear the server-side cache

## Technologies Used

- Backend: Node.js, Express.js
- Frontend: React.js
- Data Visualization: recharts, react-force-graph
- APIs: ORCID, Crossref, DataCite
- Database: SQLite/MongoDB (for caching)

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License.

## Acknowledgements

This project is based on the original [orcid-node](https://github.com/ostephens/orcid-node) repository created by Owen Stephens. It has been significantly enhanced with additional features and improvements.

## Support

For issues, questions, or contributions, please open an issue in the GitHub repository or contact the maintainers.
