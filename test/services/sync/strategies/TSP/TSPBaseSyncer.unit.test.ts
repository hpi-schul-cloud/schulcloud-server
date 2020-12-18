import { expect } from 'chai';

import { TSPBaseSyncer, SYNCER_TARGET } from '../../../../../src/services/sync/strategies/TSP/TSPBaseSyncer';

describe('TSPBaseSyncer', () => {
	it('implements the Syncer interface', () => {
		expect(TSPBaseSyncer.params).to.not.equal(undefined);
		expect(TSPBaseSyncer.respondsTo).to.not.equal(undefined);
		expect(TSPBaseSyncer.aggregateStats).to.not.equal(undefined);
	});

	describe('repondsTo', () => {
		it.skip('should accept the exported syncer target', () => {
			// skipped until we can mock Configurations
			expect(TSPBaseSyncer.respondsTo(SYNCER_TARGET)).to.equal(true);
		});
	});

	describe('params', () => {
		it('should accept empty params and data', () => {
			expect(TSPBaseSyncer.params(undefined, undefined)).to.be.ok;
		});

		it('should accept valid config objects via params.query or data', () => {
			const config = { schoolIdentifier: '42' };
			expect(TSPBaseSyncer.params({ query: { config } })).to.deep.equal([config]);
			expect(TSPBaseSyncer.params(undefined, { config })).to.deep.equal([config]);
		});
	});
});
