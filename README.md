# ORCID Institutional Dashboard

## Overview

The ORCID Institutional Dashboard is a comprehensive tool for visualizing and analyzing ORCID data affiliated with specific organizations. This application provides insights into research output, collaboration networks, and institutional affiliations.

## Features

- Flexible search by institution, email domain, or custom queries
- Data visualization including work distribution by type and collaboration networks
- Detailed author profiles with selectable and exportable works
- Bulk data export in multiple formats (CSV, Excel, JSON, PDF, BibTeX, RIS)
- Enrichment report for identifying data quality improvement opportunities

## Installation

1. Clone the repository:
   ```
   git clone https://github.com/your-username/orcid-institutional-dashboard.git
   ```

2. Navigate to the project directory:
   ```
   cd orcid-institutional-dashboard
   ```

3. Install dependencies:
   ```
   npm install
   ```

4. Create a `.env` file in the root directory and add the following environment variables:
   ```
   PORT=3000
   ORCID_API_URL=https://pub.orcid.org/v3.0
   ```

5. Start the development server:
   ```
   npm run dev
   ```

## Usage

1. Open your web browser and navigate to `http://localhost:3000`
2. Use the search functionality to query ORCID data by institution or email domain
3. Explore visualizations and author profiles
4. Export data in your preferred format

## API Documentation

The application exposes the following API endpoints:

- `GET /api/search`: Search for ORCID data
  - Query parameters:
    - `q`: Search query (e.g., `ringgold=123456&emaildomain=example.com`)

- `GET /api/export/:format`: Export ORCID data in various formats
  - Path parameters:
    - `format`: Export format (csv, excel, json, pdf, bibtex, ris)
  - Query parameters:
    - `q`: Search query (same as /api/search)

For detailed API documentation, please refer to the [API.md](./API.md) file.

## Deployment

### Deploying to Heroku

This application is ready for deployment on Heroku. Follow these steps:

1. Create a new Heroku app:
   ```bash
   heroku create your-app-name
   ```

2. Set environment variables:
   ```bash
   heroku config:set NODE_ENV=production
   heroku config:set ORCID_API_URL=https://pub.orcid.org/v3.0
   ```

3. Deploy the application:
   ```bash
   git push heroku main
   ```

4. Open the application:
   ```bash
   heroku open
   ```

**Important Notes:**
- The frontend is automatically built during deployment via the `heroku-postbuild` script
- SQLite is used for caching and will reset on dyno restarts (this is acceptable for cache data)
- The application uses graceful shutdown to handle Heroku's dyno cycling
- Logs can be viewed with `heroku logs --tail`

### Environment Variables

Required environment variables (see `.env.example`):
- `PORT` - Set automatically by Heroku
- `ORCID_API_URL` - ORCID API endpoint (default: https://pub.orcid.org/v3.0)
- `NODE_ENV` - Environment mode (production recommended for Heroku)

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the Apache 2.0 License. See the [LICENSE](./LICENSE) file for details.

## Acknowledgements

This project is based on the original orcid-node repository created by Owen Stephens and has been significantly enhanced with additional features and improvements by Adam Vials Moore.
