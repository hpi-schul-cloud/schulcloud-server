const { expect } = require('chai');
const rewire = require('rewire');

const firstLogin = rewire('../../../src/services/user/firstLogin');

describe('firstLogin.test', () => {
	let parseDate;

	before(() => {
		parseDate = firstLogin.__get__('parseDate');
	});

	it('should parse the provided date', () => {
		const date1 = parseDate('22.08.2009');
		const date2 = parseDate('20.01.2004');
		const date3 = parseDate('15.10.2009');
		expect(date1.getTime()).to.eq(new Date('2009-08-22').getTime());
		expect(date2.getTime()).to.eq(new Date('2004-01-20').getTime());
		expect(date3.getTime()).to.eq(new Date('2009-10-15').getTime());
	});

	it('should throw an error if the date string is invalid', () => {
		expect(() => parseDate('08.22.2009')).to.throw();
		expect(() => parseDate('8.22.2009')).to.throw();
		expect(() => parseDate('fjhshgf')).to.throw();
		expect(() => parseDate('')).to.throw();
		expect(() => parseDate(undefined)).to.throw();
		expect(() => parseDate(null)).to.throw();
	});
});
