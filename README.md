This is a Simple nodejs app for searching for ORCiDs by Ringgold ID for US and UK HE institutions. The app works as follows:

* Given an institution's Ringgold ID, search ORCID via the public API with the query "ringgold-org-id:<ringgold id>"
* Retrieve all the ORCID IDs found (paging through the results 200 at a time)
* Display the list of the retrieved ORCIDs in the browser
* Within the browser, progressively enhance the data by retrieving the full ORCID profile for each ORCID ID in the page
* When all profiles have been retrieved and the relevant information displayed, reformat as a searchable, sortable and exportable data table

The information currently displayed by the application is:
* ORCID ID
* Last modified date
* Name
* List of Education entries
* List of Employment entries
* List of additional identifiers for the person
* List of email addresses for the person
* Count of the number of works on their ORCID record

Because of the way the application works, the user experience is very S L O W, but a patient user will eventually get a full report on ORCIDS that are linked to the selected institution by either employment or education.

Requires:
* npm
* nodejs
* request
* express
* node-fetch

To install:
* Clone or download this repository
* execute `npm install`

To run:
* node server.js

View demo version:
* https://powerful-chamber-19570.herokuapp.com