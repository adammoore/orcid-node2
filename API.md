# ORCID Institutional Dashboard API Documentation

This document provides detailed information about the API endpoints available in the ORCID Institutional Dashboard.

## Base URL

All API requests should be prefixed with the base URL of your deployed application. For local development, this is typically:

```
http://localhost:3000/api
```

## Endpoints

### Search ORCID Data

Retrieves ORCID data based on the provided search query.

- **URL**: `/search`
- **Method**: `GET`
- **URL Params**: 
  - `q=[string]` (required): The search query
- **Success Response**:
  - **Code**: 200
  - **Content**: Array of ORCID profiles
- **Error Response**:
  - **Code**: 500
  - **Content**: `{ error: "Error message" }`

#### Example

```
GET /api/search?q=ringgold=123456&emaildomain=example.com
```

### Export ORCID Data

Exports ORCID data in various formats.

- **URL**: `/export/:format`
- **Method**: `GET`
- **URL Params**:
  - `format=[string]` (required): The export format (csv, excel, json, pdf, bibtex, ris)
  - `q=[string]` (required): The search query (same as /api/search)
- **Success Response**:
  - **Code**: 200
  - **Content**: File download in the specified format
- **Error Response**:
  - **Code**: 500
  - **Content**: `{ error: "Error message" }`

#### Example

```
GET /api/export/csv?q=ringgold=123456&emaildomain=example.com
```

### Get Analytics

Retrieves advanced analytics for ORCID data.

- **URL**: `/analytics`
- **Method**: `GET`
- **URL Params**:
  - `q=[string]` (required): The search query (same as /api/search)
- **Success Response**:
  - **Code**: 200
  - **Content**: `{ collaborationPatterns: Object, keyResearchers: Array }`
- **Error Response**:
  - **Code**: 500
  - **Content**: `{ error: "Error message" }`

#### Example

```
GET /api/analytics?q=ringgold=123456&emaildomain=example.com
```

## Rate Limiting

To ensure fair usage and protect our services, API requests are rate-limited. Each client is allowed a maximum of 100 requests per minute.

## Authentication

Currently, the API does not require authentication. However, future versions may implement an authentication mechanism to protect sensitive data and manage access control.

## Error Handling

All endpoints follow a consistent error response format. In case of an error, the API will return a JSON object with an `error` field containing a descriptive error message.

Example error response:

```json
{
  "error": "Failed to fetch data: Internal server error"
}
```

## Data Models

For detailed information about the structure of ORCID profiles and other data models used in the API responses, please refer to the [Data Models](./DATA_MODELS.md) documentation.

## Changelog

For information about API changes and version history, please refer to the [Changelog](./CHANGELOG.md).

## Support

If you encounter any issues or have questions about the API, please open an issue in the [GitHub repository](https://github.com/your-username/orcid-institutional-dashboard/issues) or contact the maintainers directly.
