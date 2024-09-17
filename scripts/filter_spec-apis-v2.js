const fs = require('fs');
const axios = require('axios');
const pathHelper = require('path');

// Get the path prefix from command line arguments
const pathPrefix = process.argv[2];
const outputPath = pathHelper.resolve(__dirname, 'filtered-spec.json');

// URL to fetch the Swagger JSON
const swaggerUrl = 'https://test2.schulportal-thueringen.de/tip-ms/api/swagger.json';

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
			if (spec.definitions[schema]) {
				getReferencedSchemas(spec.definitions[schema]).forEach((ref) => schemas.add(ref));
			}
		});

		const newSize = schemas.size;

		if (oldSize === newSize) {
			break;
		}
	}
}
/*
axios
	.get(swaggerUrl)
	// eslint-disable-next-line promise/always-return
	.then((response) => {
		const spec = response.data;

		// Debugging: Ausgabe der gesamten Antwort
		// console.log('Fetched OpenAPI spec:', JSON.stringify(spec, null, 2));

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
		const filteredSchemas = Object.keys(spec.definitions)
			.filter((schema) => schemas.has(schema))
			.reduce((obj, key) => {
				obj[key] = spec.definitions[key];
				return obj;
			}, {});

		// Create top-level fields from the original spec
		const filteredSwaggerDoc = {
			swagger: spec.swagger,
			info: spec.info,
			servers: spec.servers,
			paths: filteredPaths,
			definitions: filteredSchemas,
		};

		fs.writeFileSync(outputPath, JSON.stringify(filteredSwaggerDoc, null, 2));
		console.log(`Filtered spec of ${pathPrefix} written to ${outputPath}`);
	})
	.catch((error) => {
		console.error(`Error fetching the OpenAPI spec: ${error}`);
	});
*/

axios
	.get(swaggerUrl)
	.then((response) => {
		const spec = response.data;

		// Check if the spec uses 'definitions' instead of 'components'
		const definitions = spec.definitions || {};
		const paths = spec.paths || {};

		// Filter paths with the tag 'Export'
		const filteredPaths = {};
		for (const path in paths) {
			if (Object.prototype.hasOwnProperty.call(paths, path)) {
				const methods = paths[path];
				for (const method in methods) {
					if (Object.prototype.hasOwnProperty.call(methods, method)) {
						const operation = methods[method];
						if (operation.tags && operation.tags.includes('Export')) {
							if (!filteredPaths[path]) {
								filteredPaths[path] = {};
							}
							filteredPaths[path][method] = operation;
						}
					}
				}
			}
		}

		// Create the filtered spec
		const filteredSpec = {
			swagger: spec.swagger,
			info: spec.info,
			paths: filteredPaths,
			definitions,
		};

		// Write the filtered spec to a file
		fs.writeFileSync(outputPath, JSON.stringify(filteredSpec, null, 2));
		console.log(`Filtered spec of ${pathPrefix} written to ${outputPath}`);
		return null; // Ensure the promise chain returns a value
	})
	.catch((error) => {
		console.error('Error fetching the OpenAPI spec:', error);
		throw error; // Ensure the promise chain throws an error
	});
