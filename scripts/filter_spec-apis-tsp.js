/**
 * This script filters the OpenAPI spec of the TSP API to only include paths with the tag 'Export'.
 * In 'apps\server\src\modules\common-cartridge\common-cartridge-client\README.md' you can find the instructions to run this script.
 */

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
