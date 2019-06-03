const assert = require('assert');

const chai = require('chai');
const mockery = require('mockery');
const promisify = require('es6-promisify');
const fs = require('fs');

const readFile = promisify(fs.readFile);
const writeFile = promisify(fs.writeFile);
const path = require('path');


describe('content service', function () {
	this.timeout(10000);	// for slow require(app) call
	const requestMock = options => readFile(requestToFilename(options)).then(data => JSON.parse(data));

	let app = null;
	let resourcesService = null;
	let searchService = null;

	before((done) => {
		mockery.enable({
			warnOnReplace: false,
			warnOnUnregistered: false,
			useCleanCache: true,
		});
		mockery.registerMock('request-promise-native', requestMock);
		app = require('../../../src/app');

		app.setup();
		resourcesService = app.service('content/resources');
		searchService = app.service('content/search');
		done();
	});

	after((done) => {
		mockery.deregisterAll();
		mockery.disable();
		done();
	});

	it('registered the resources service', () => {
		assert.ok(resourcesService);
	});
	it('registered the search service', () => {
		assert.ok(searchService);
	});

	it('resources service: provides the default resources with an empty query', () => resourcesService.find({ query: {} }).then((result) => {
		chai.expect(result.data).to.have.length.above(4);
	}));
	it('search service: provides the default resources with an empty query', () => searchService.find({ query: {} }).then((result) => {
		chai.expect(result.data).to.have.length.above(4);
	}));

	it('resources service: provides only a single resource with $limit 1', () => resourcesService.find({ query: { $limit: 1 } })
		.then((result) => {
			chai.expect(result.data).to.have.lengthOf(1);
		}));
	it('search service: provides only a single resource with $limit 1', () => searchService.find({ query: { $limit: 1 } })
		.then((result) => {
			chai.expect(result.data).to.have.lengthOf(1);
		}));
});

function writeResponseToDisk(requestOptions, response) {
	return writeFile(requestToFilename(requestOptions), response);
}

function requestToFilename(requestOptions) {
	const key = JSON.stringify(requestOptions.qs).replace(/([^ -~]|[\."<>\|\\\/\:\*\?])+/g, '');	// just ASCII characters, NTFS-safe
	const filename = `response${key}.json`;
	return path.resolve(__dirname, 'mock', filename);
}
