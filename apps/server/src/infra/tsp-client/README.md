# TSP API CLIENT

> A short introduction how this module can be used and the api client is generated.

## How to use the api client

The clients for the different Tsp endpoints should be created through TspClientFactory.
Through the create methods of the factory the basic configuration will be set. Currently the
factory sets the base url and generates the JWT used for the requests. You can use the client
like this:

```typescript
export class MyNewService {
    // inject the factory into the constructor
    constructor(private readonly tspClientFactory: TspClientFactory) {}

    public async doSomeStuff(): Promise<void> {
        // this will create a fully initialized client
        const exportClient = tspClientFactory.createExportClient();

        // calling the api
        const versionResponse = await exportClient.version();


        // do other stuff...
    }
}
```

## How the code generation works

We are using the openapi-generator-cli to generate apis, models and supporting files in the
`generated` directory. **DO NOT** modify anything in the `generated` folder, because it will
be deleted on the next client generation.

The client generation is done with the npm command `npm run generate-client:tsp-api`. This
will delete the old and create new files. We are using the `tsp-api` generator configuration 
from the `openapitools.json` found in the repository root. You can add new endpoints by
extending the `FILTER` list in the `openapiNormalizer` section with new `operationId` entries.
New models must be added to the list of `models` in the `globalProperty` section.
