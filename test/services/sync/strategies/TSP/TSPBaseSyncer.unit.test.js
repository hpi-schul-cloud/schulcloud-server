const { expect } = require('chai');
const { BadRequest } = require('@feathersjs/errors');

const {
	TSPBaseSyncer,
	SYNCER_TARGET,
} = require('../../../../../src/services/sync/strategies/TSP/TSPBaseSyncer');

describe('TSPBaseSyncer', () => {
	it('implements the Syncer interface', () => {
		expect(TSPBaseSyncer.params).to.not.equal(undefined);
		expect(TSPBaseSyncer.respondsTo).to.not.equal(undefined);
		expect(TSPBaseSyncer.aggregateStats).to.not.equal(undefined);
	});

	describe('repondsTo', () => {
		it('should accept the exported syncer target', () => {
			expect(TSPBaseSyncer.respondsTo(SYNCER_TARGET)).to.equal(true);
		});
	});

	describe('params', () => {
		it('should not accept empty params and data', () => {
			try {
				TSPBaseSyncer.params(undefined, undefined);
				throw new Error('The previous call should have failed.');
			} catch (err) {
				expect(err).to.be.instanceOf(BadRequest);
			}
		});

		it('should accept valid config objects via params.query or data', () => {
			const config = { baseUrl: 'http://example.com', clientId: 'foobar42' };
			expect(TSPBaseSyncer.params({ query: { config } })).to.deep.equal([config]);
			expect(TSPBaseSyncer.params(undefined, { config })).to.deep.equal([config]);
		});

		it('should not accept incomplete config objects', () => {
			try {
				TSPBaseSyncer.params(undefined, { config: { clientId: 'foobar42' } });
				throw new Error('The previous call should have failed.');
			} catch (err) {
				expect(err).to.be.instanceOf(BadRequest);
				expect(/(?=.*missing)(?=.*parameter)(?=.*baseUrl)/i.test(err.message)).to.equal(true);
			}
			try {
				TSPBaseSyncer.params(undefined, { config: { baseUrl: 'http://schul-cloud.org' } });
				throw new Error('The previous call should have failed.');
			} catch (err) {
				expect(err).to.be.instanceOf(BadRequest);
				expect(/(?=.*missing)(?=.*parameter)(?=.*clientId)/i.test(err.message)).to.equal(true);
			}
		});
	});
});
