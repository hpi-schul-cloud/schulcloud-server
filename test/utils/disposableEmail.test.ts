import { expect } from 'chai';
import { Configuration } from '@hpi-schul-cloud/commons';

import { isDisposableEmail } from '../../src/utils/disposableEmail';

describe('[utils] disposableEmail', () => {
	it('invalid input', () => {
		expect(isDisposableEmail('my10minutemail.com')).is.false;
		expect(isDisposableEmail('!!!@123nutemail.com')).is.false;
		expect(isDisposableEmail('mail@')).is.false;
		expect(isDisposableEmail('mail@de')).is.false;
		expect(isDisposableEmail('')).is.false;
		expect(isDisposableEmail(false)).is.false;
		expect(isDisposableEmail(null)).is.false;
		expect(isDisposableEmail(undefined)).is.false;
	});

	it('check false', () => {
		expect(isDisposableEmail('user@schul-cloud.org')).is.false;
	});

	it('check true (exact match)', () => {
		expect(isDisposableEmail('user@my10minutemail.com')).is.true;
		expect(isDisposableEmail('user@my10minutemail.com  ')).is.true;
		expect(isDisposableEmail('user@my10minuteMAIL.com')).is.true;
		expect(isDisposableEmail('user@info.tm')).is.true;
	});

	it('check true (wildcard)', () => {
		expect(isDisposableEmail('user@sub.info.tm')).is.true;
	});

	describe('custom blacklist', () => {
		let originalConfiguration;
		beforeEach(() => {
			if (Configuration.has('ADDITIONAL_BLACKLISTED_EMAIL_DOMAINS')) {
				originalConfiguration = Configuration.get('ADDITIONAL_BLACKLISTED_EMAIL_DOMAINS');
			}
		});

		afterEach(() => {
			Configuration.set('ADDITIONAL_BLACKLISTED_EMAIL_DOMAINS', originalConfiguration);
		});

		it('empty', () => {
			Configuration.set('ADDITIONAL_BLACKLISTED_EMAIL_DOMAINS', '');
			expect(isDisposableEmail('user@schul-cloud.org')).is.false;
		});

		it('block', () => {
			Configuration.set('ADDITIONAL_BLACKLISTED_EMAIL_DOMAINS', 'some.domain,schul-cloud.org,more.de');
			expect(isDisposableEmail('user@schul-cloud.org')).is.true;
			expect(isDisposableEmail('user@other.org')).is.false;
		});

		it('block sub', () => {
			Configuration.set('ADDITIONAL_BLACKLISTED_EMAIL_DOMAINS', 'any.tld,schul-cloud.org');
			expect(isDisposableEmail('user@test.schul-cloud.org')).is.true;
		});
	});
});
