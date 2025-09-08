# VIDIS API CLIENT

> A short introduction how this module can be used and the api client is generated.

## How to use the api client

The clients for the different VIDIS endpoints should be created through the various API factory
provided in the generated files (IDMBetreiberApiFactory, EducationProviderApiFactory, DefaultApiFactory).
Through the create methods of the factory the basic configuration will be set. 

Currently, the factory only sets the base url. The factory do accept parameters for auth, but does 
not do anything with it. This is because the openapi-yml file provided from VIDIS is incomplete. 
You will need to set the authentication header manually (see the existing vidis client adapter 
for an example).

## How the code generation works

> IMPORTANT: The `vidis.yml` is provided from VIDIS is incomplete and does not reflect the full
> specifications of the VIDIS API endpoint

We are using the openapi-generator-cli to generate apis, models and supporting files in the
`generated` directory. **DO NOT** modify anything in the `generated` folder, because it will
be deleted on the next client generation.

The client generation is done with the npm command `npm run generate-client:vidis-api`. This
will delete the old and create new files. We are using the `vidis-api` generator configuration 
from the `openapitools.json` found in the repository root. You can add new endpoints by
extending the `FILTER` list in the `openapiNormalizer` section with new `operationId` entries.
New models must be added to the list of `models` in the `globalProperty` section.
