const { expect } = require('chai');
const { BadRequest } = require('@feathersjs/errors');
const mockery = require('mockery');

const {
	TSPBaseSyncer,
	SYNCER_TARGET,
} = require('../../../../../src/services/sync/strategies/TSP/TSPBaseSyncer');

describe.only('TSPBaseSyncer', () => {
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

	describe('getSchools', () => {
		const MOCK_SCHOOLS = [
			{ schuleNummer: 42, schuleName: 'Douglas Adams Gymnasium' },
			{ schuleNummer: 3000, schuleName: 'Mars-Universität' },
		];
		const TSPAPIMock = function TSPAPIMock() {
			this.request = (url) => {
				if (url === '/tip-ms/api/schulverwaltung_export_schule') {
					return MOCK_SCHOOLS;
				}
				throw new Error('Unknown request URL');
			};
		};

		let TSPBaseSyncerWithMockedApi;

		before(() => {
			mockery.enable({
				useCleanCache: true,
				warnOnUnregistered: false,
			});
			mockery.registerMock('./TSP', { TspApi: TSPAPIMock });
			// eslint-disable-next-line global-require, max-len
			TSPBaseSyncerWithMockedApi = require('../../../../../src/services/sync/strategies/TSP/TSPBaseSyncer').TSPBaseSyncer;
		});

		after(() => {
			mockery.deregisterAll();
			mockery.disable();
		});

		it('should return schools fetched from the TSP API', async () => {
			const syncer = new TSPBaseSyncerWithMockedApi();
			expect(await syncer.getSchools()).to.equal(MOCK_SCHOOLS);
		});
	});
});
