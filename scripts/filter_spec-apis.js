const fs = require('fs');
const axios = require('axios');
const pathHelper = require('path');

// Get the path prefix from command line arguments
const pathPrefix = process.argv[2];
const outputPath = pathHelper.resolve(__dirname, 'filtered-spec.json');

// URL to fetch the Swagger JSON
const swaggerUrl = 'http://localhost:3030/api/v3/docs-json';

if (!pathPrefix) {
	console.error('Please provide a controller name to filter as a command line argument.');
	process.exit(1);
}

axios
	.get(swaggerUrl)
	// eslint-disable-next-line promise/always-return
	.then((response) => {
		const spec = response.data;
		// Filter paths that start with the provided prefix
		const filteredPaths = Object.keys(spec.paths)
			.filter((path) => path.startsWith(pathPrefix))
			.reduce((obj, key) => {
				obj[key] = spec.paths[key];
				return obj;
			}, {});

		// Create top-level fields from the original spec
		const filteredSwaggerDoc = {
			openapi: spec.openapi,
			info: spec.info,
			servers: spec.servers,
			paths: filteredPaths,
			components: spec.components,
		};

		fs.writeFileSync(outputPath, JSON.stringify(filteredSwaggerDoc, null, 2));
		console.log(`Filtered spec of ${pathPrefix} written to ${outputPath}`);
	})
	.catch((error) => {
		console.error(`Error fetching the OpenAPI spec: ${error}`);
	});

/** use this command to generate the client and delete the filtered spec file
 * npx openapi-generator-cli generate -i './scripts/filtered-spec.json' -g typescript-axios -o "apps/server/src/modules/common-cartridge/common-cartridge-client/courses-api-client" --skip-validate-spec -c 'openapitools-config.json'; rm .\scripts\filtered-spec.json && rm .\scripts\filtered-spec.json
 */
