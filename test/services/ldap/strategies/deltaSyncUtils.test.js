const { expect } = require('chai');
const moment = require('moment');

const {
	filterForModifiedEntities,
	getModifiedFilter,
	dateToLdapTimestamp,
} = require('../../../../src/services/ldap/strategies/deltaSyncUtils');

describe('deltaSyncUtils', () => {
	describe('#getModifiedFilter', () => {
		it('returns expected filter based on timestamp', () => {
			expect(getModifiedFilter('20201020000000Z')).to.equal(
				'(|(!(modifyTimestamp=*))(!(modifyTimestamp<=20201020000000Z)))'
			);
			expect(getModifiedFilter('19890403203456Z')).to.equal(
				'(|(!(modifyTimestamp=*))(!(modifyTimestamp<=19890403203456Z)))'
			);
		});

		it('accepts an optional attribute name', () => {
			expect(getModifiedFilter('19980219040216Z', 'updatedAt')).to.equal(
				'(|(!(updatedAt=*))(!(updatedAt<=19980219040216Z)))'
			);
		});
	});

	describe('#filterForModifiedEntities', () => {
		it('returns the base filter if no timestamp is given', () => {
			expect(filterForModifiedEntities()).to.equal('');
			expect(filterForModifiedEntities(undefined, '(foo=bar)')).to.equal('(foo=bar)');
		});

		it('returns the base filter if an invalid timestamp is given', () => {
			expect(filterForModifiedEntities('2020', '(foo=bar)')).to.equal('(foo=bar)');
		});

		it('adds a timestamp based filter if correct format is used', () => {
			expect(filterForModifiedEntities('11111111111111Z', '(foo=bar)')).to.equal(
				'(&(foo=bar)(|(!(modifyTimestamp=*))(!(modifyTimestamp<=11111111111111Z))))'
			);
		});
	});

	describe('#dateToLDAPTimestamp', () => {
		it('should return date in format YYYYMMDDHHmmssZ', () => {
			const date = new Date('2021-03-26T13:42:13.409Z');
			expect(dateToLdapTimestamp(date)).to.equal('20210326134213Z');
		});

		it('should return correct date format for moment utc', () => {
			const date = moment('2021-03-26T13:42:13.409Z').utc().toDate();
			expect(dateToLdapTimestamp(date)).to.equal('20210326134213Z');
		});
	});
});
