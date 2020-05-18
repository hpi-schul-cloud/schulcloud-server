const { expect } = require('chai');

const { isDisposableEmail } = require('../../src/utils/disposableEmail');

describe('[utils] disposableEmail', () => {
	it('invalid input', () => {
		expect(isDisposableEmail('my10minutemail.com')).is.false;
	});

	it('check false', () => {
		expect(isDisposableEmail('user@schul-cloud.org')).is.false;
	});

	it('check true (exact match)', () => {
		expect(isDisposableEmail('user@my10minutemail.com')).is.true;
		expect(isDisposableEmail('user@info.tm')).is.true;
	});

	it('check true (wildcard)', () => {
		expect(isDisposableEmail('user@sub.info.tm')).is.true;
	});
});
