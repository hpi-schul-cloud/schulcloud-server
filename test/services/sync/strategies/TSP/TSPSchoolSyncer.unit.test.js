const { expect } = require('chai');

const { Configuration } = require('@hpi-schul-cloud/commons');
const { TSPSchoolSyncer } = require('../../../../../src/services/sync/strategies/TSP/TSPSchoolSyncer');

describe(TSPSchoolSyncer.name, () => {
	describe('lastSyncedAtEnabled field should be set to', () => {
		let configBefore;

		beforeEach(() => {
			configBefore = Configuration.toObject({ plainSecrets: true });
		});

		afterEach(() => {
			Configuration.reset(configBefore);
		});

		it('true by default if the feature flag has not been set in the configuration', () => {
			const syncer = new TSPSchoolSyncer(undefined, undefined, undefined, undefined);
			expect(syncer.lastSyncedAtEnabled).to.equal(true);
		});

		it('true if the feature flag has been enabled in the configuration', () => {
			Configuration.set('FEATURE_SYNC_LAST_SYNCED_AT_ENABLED', true);

			const syncer = new TSPSchoolSyncer(undefined, undefined, undefined, undefined);
			expect(syncer.lastSyncedAtEnabled).to.equal(true);
		});

		it('false if the feature flag has been disabled in the configuration', () => {
			Configuration.set('FEATURE_SYNC_LAST_SYNCED_AT_ENABLED', false);

			const syncer = new TSPSchoolSyncer(undefined, undefined, undefined, undefined);
			expect(syncer.lastSyncedAtEnabled).to.equal(false);
		});
	});
});
