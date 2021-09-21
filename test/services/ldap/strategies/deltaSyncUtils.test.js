const { expect } = require('chai');
const moment = require('moment');

const {
	filterForModifiedEntities,
} = require('../../../../src/services/ldap/strategies/deltaSyncUtils');

describe('deltaSyncUtils', () => {
	describe('#filterForModifiedEntities', () => {
		it('returns the base filter if no timestamp is given', () => {
			expect(filterForModifiedEntities()).to.equal('');
			expect(filterForModifiedEntities(undefined, '(foo=bar)')).to.equal('(foo=bar)');
		});

		it('returns the base filter if an invalid timestamp is given', () => {
			expect(filterForModifiedEntities('2020', '(foo=bar)')).to.equal('(foo=bar)');
		});

		it('adds a timestamp based filter if correct format is used', () => {
			const school = { ldapLastSync: '11111111111111Z' };
			expect(filterForModifiedEntities(school, '(foo=bar)')).to.equal('(foo=bar)');
		});
	});
});
