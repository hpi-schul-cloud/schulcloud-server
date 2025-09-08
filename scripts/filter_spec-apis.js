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

// Recursively search for an element with the provided name in the source object
function getElementWithName(name, src) {
	const results = [];

	Object.keys(src).forEach((key) => {
		const element = src[key];

		if (key === name) {
			results.push(element);
			return;
		}

		if (typeof element === 'object') {
			results.push(...getElementWithName(name, element));
		}
	});

	return results;
}

// Get all referenced schemas from the provided spec
function getReferencedSchemas(spec) {
	return getElementWithName('$ref', spec).map((ref) => ref.split('/').pop());
}

// Expand the set of schemas by adding all referenced schemas
function expandSchemaSet(schemas, spec) {
	while (true) {
		const oldSize = schemas.size;

		schemas.forEach((schema) => {
			if (spec.components.schemas[schema]) {
				getReferencedSchemas(spec.components.schemas[schema]).forEach((ref) => schemas.add(ref));
			}
		});

		const newSize = schemas.size;

		if (oldSize === newSize) {
			break;
		}
	}
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

		// Get referenced schemas from the filtered paths
		const schemas = new Set();
		Object.keys(filteredPaths).forEach((path) => {
			getReferencedSchemas(filteredPaths[path]).forEach((schema) => schemas.add(schema));
		});

		// Expand the set of schemas to include all referenced schemas from other schemas
		expandSchemaSet(schemas, spec);

		// Filter schemas
		const filteredSchemas = Object.keys(spec.components.schemas)
			.filter((schema) => schemas.has(schema))
			.reduce((obj, key) => {
				obj[key] = spec.components.schemas[key];
				return obj;
			}, {});

		// Create top-level fields from the original spec
		const filteredSwaggerDoc = {
			openapi: spec.openapi,
			info: spec.info,
			servers: spec.servers,
			paths: filteredPaths,
			components: {
				securitySchemes: spec.components.securitySchemes,
				schemas: filteredSchemas,
			},
		};

		fs.writeFileSync(outputPath, JSON.stringify(filteredSwaggerDoc, null, 2));
		console.log(`Filtered spec of ${pathPrefix} written to ${outputPath}`);
	})
	.catch((error) => {
		console.error(`Error fetching the OpenAPI spec: ${error}`);
	});
