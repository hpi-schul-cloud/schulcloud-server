import { Configuration } from '@hpi-schul-cloud/commons';
import { expect } from 'chai';
import {
	defineConsentStatus,
	isParentConsentRequired,
	modifyDataForUserSchema,
	userToConsent,
} from '../../../../src/services/consent/utils/consent';
import { createDateFromAge, createParentConsent, createUserConsent } from './helper';

describe('test consent utils', () => {
	describe('test defineConsentStatus', () => {
		it('test missing between, user without parent', () => {
			const age = Configuration.get('CONSENT_AGE_SECOND') - 1;
			const birthday = createDateFromAge(age);

			const consentStatus = defineConsentStatus(birthday, {
				userConsent: createUserConsent(true, true),
			});

			expect(consentStatus).to.equal('missing');
		});

		it('test perentAgreed', () => {
			const age = Configuration.get('CONSENT_AGE_SECOND') - 1;
			const birthday = createDateFromAge(age);

			const consentStatus = defineConsentStatus(birthday, {
				parentConsents: [createParentConsent(true, true)],
			});

			expect(consentStatus).to.equal('parentsAgreed');
		});

		it('test mid age ok', () => {
			const age = Configuration.get('CONSENT_AGE_FIRST');
			const birthday = createDateFromAge(age);

			const consentStatus = defineConsentStatus(birthday, {
				parentConsents: [createParentConsent(true, true)],
				userConsent: createUserConsent(true, true),
			});

			expect(consentStatus).to.equal('ok');
		});

		it('test only user missing', () => {
			const age = Configuration.get('CONSENT_AGE_SECOND');
			const birthday = createDateFromAge(age);

			const consentStatus = defineConsentStatus(birthday, {
				parentConsents: [createParentConsent(true, true)],
			});

			expect(consentStatus).to.equal('missing');
		});

		it('test only user ok', () => {
			const age = Configuration.get('CONSENT_AGE_SECOND');
			const birthday = createDateFromAge(age);

			const consentStatus = defineConsentStatus(birthday, {
				userConsent: createUserConsent(true, true),
			});

			expect(consentStatus).to.equal('ok');
		});

		it('test before first gate ok', () => {
			const age = Configuration.get('CONSENT_AGE_FIRST') - 1;
			const birthday = createDateFromAge(age);

			const consentStatus = defineConsentStatus(birthday, {
				parentConsents: [createParentConsent(true, true)],
			});

			expect(consentStatus).to.equal('ok');
		});

		it('test before first gate missing', () => {
			const age = Configuration.get('CONSENT_AGE_FIRST') - 1;
			const birthday = createDateFromAge(age);

			const consentStatus = defineConsentStatus(birthday, {
				userConsent: createUserConsent(true, true),
			});

			expect(consentStatus).to.equal('missing');
		});
	});

	describe('test parentConsentRequired', () => {
		it('do need parent consent', () => {
			const age = Configuration.get('CONSENT_AGE_SECOND') - 1;
			const birthday = createDateFromAge(age);

			const is = isParentConsentRequired(birthday);

			expect(is).to.equal(true);
		});

		it('do not need parent consent', () => {
			const age = Configuration.get('CONSENT_AGE_SECOND');
			const birthday = createDateFromAge(age);

			const is = isParentConsentRequired(birthday);

			expect(is).to.equal(false);
		});
	});

	it('test converting a user to a consent object without consent', () => {
		const user = {
			birthday: createDateFromAge(17),
			_id: 'affenID',
			consent: {
				userConsent: createUserConsent(true, true),
			},
		};

		const consent = userToConsent(user);

		expect(consent).to.have.property('_id', user._id);
		expect(consent).to.have.property('userId', user._id);
		expect(consent._id).to.equal(consent.userId);
		expect(consent).to.have.property('requiresParentConsent');
		expect(consent).to.have.property('consentStatus');
		expect(consent).to.have.property('userConsent', user.consent.userConsent);
	});

	it('test modifyDataForUserSchema', () => {
		const data = {
			_id: 'not a ape',
			someOtherData: 'affe',
			more: 'butter',
			random: Math.random(),
			data: new Date(),
		};

		// eslint-disable-next-line no-unused-vars
		const { _id, userId, ...reduced } = data;

		const user = modifyDataForUserSchema(data);

		expect(user).to.have.property('consent');
		expect(user.consent).deep.equals(reduced);
	});
});
