const { expect } = require('chai');
const rewire = require('rewire');

const firstLogin = rewire('../../../src/services/user/firstLogin');

describe('firstLogin.test', () => {
	let parseDate;

	before(() => {
		// eslint-disable-next-line no-underscore-dangle
		parseDate = firstLogin.__get__('parseDate');
	});

	it('should parse the provided date', () => {
		const date1 = parseDate('2009-08-22');
		const date2 = parseDate('2004-01-20');
		const date3 = parseDate('2009-10-15');
		const date4 = parseDate('2009-1-2');
		expect(date1.getTime()).to.eq(new Date('2009-08-22').getTime());
		expect(date2.getTime()).to.eq(new Date('2004-01-20').getTime());
		expect(date3.getTime()).to.eq(new Date('2009-10-15').getTime());
		expect(date4.getTime()).to.eq(new Date('2009-01-02').getTime());
	});

	it('should parse the date only from a provided datetime', () => {
		// check if the provided datetime is parsed "timezone-neutral"
		// ~5min before midnight
		const date1 = parseDate('2021-08-22T23:55:40.166Z');
		// ~5min after midnight
		const date2 = parseDate('2021-08-23T00:05:42.166Z');
		expect(date1.getTime()).to.eq(new Date('2021-08-22').getTime());
		expect(date2.getTime()).to.eq(new Date('2021-08-23').getTime());
	});

	it('should throw an error if the date string is invalid', () => {
		expect(() => parseDate('2009-22-08')).to.throw();
		expect(() => parseDate('fjhshgf')).to.throw();
	});

	it('should throw an error if the date string is empty', () => {
		expect(() => parseDate('')).to.throw();
		expect(() => parseDate(undefined)).to.throw();
		expect(() => parseDate(null)).to.throw();
	});
});
