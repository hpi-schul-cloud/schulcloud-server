const { expect } = require('chai');

const app = require('../../../src/app');
const testObjects = require('../helpers/testObjects')(app);

const datasourcesService = app.service('datasources');

describe.only('datasources service', () => {
	it('registered the datasources service', () => {
		expect(datasourcesService).to.not.be.undefined;
	});

	/* it('creates a new datasource', () => {
		const result = datasourcesService.create({ config: { type: 'csv' } });
	}); */
});
