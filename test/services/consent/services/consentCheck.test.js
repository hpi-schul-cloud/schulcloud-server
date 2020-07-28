const assert = require('assert');
const { expect } = require('chai');
const app = require('../../../../src/app');
const testObjects = require('../../helpers/testObjects')(app);
const { Configuration } = require('@schul-cloud/commons');


const TERMS = 'termsOfUseConsent';
const PRIVACY = 'privacyConsent';
const TERMS_DATE = 'dateOfTermsOfUseConsent';
const PRIVACY_DATE = 'dateOfPrivacyConsent';

const createDateFromAge = (age) => {
	const currentDate = new Date();
	const birthday = new Date();

	const randomMonth = Number.parseInt(Math.random() * 11, 10);
	let offset = 0;
	if (currentDate.getMonth() < randomMonth) {
		offset = 1;
	}

	birthday.setFullYear(currentDate.getFullYear() - age + offset);
	birthday.setMonth(randomMonth);
	return birthday;
};

const createUserWithConsent = ({
	age,
	userConsent,
	parentConsents,
	...others
}) => testObjects.createTestUser({
	birthday: createDateFromAge(age),
	consent: {
		userConsent,
		parentConsents,
	},
	...others,
});


const createUserConsent = (privacy, terms, pDate = new Date(), tDate = new Date()) => ({
	[PRIVACY]: privacy,
	[TERMS]: terms,
	[PRIVACY_DATE]: pDate,
	[TERMS_DATE]: tDate,
});

const createParentConsent = (privacy, terms, pDate = new Date(), tDate = new Date()) => ([{
	[PRIVACY]: privacy,
	[TERMS]: terms,
	[PRIVACY_DATE]: pDate,
	[TERMS_DATE]: tDate,
}]);


describe.only('consentCheck tests', () => {
	let server;
	let consentCheckService;
	let schoolSerivce;

	before((done) => {
		schoolSerivce = app.service('/schools');
		consentCheckService = app.service('/consents/:userId/check');
		server = app.listen(0, done);
	});

	after((done) => {
		server.close(done);
	});

	afterEach(async () => {
		await testObjects.cleanup(app);
	});

	it('simple consent', async () => {
		const userConsent = createUserConsent(true, true);
		const age = Configuration.get('CONSENT_AGE_SECOND');

		const testUser = await createUserWithConsent({ age, userConsent });

		const res = await consentCheckService.find({
			route: {
				userId: testUser._id,
			},
			query: {
				simple: true,
			},
		});

		expect(res).to.have.property('haveBeenUpdated');
		expect(res).to.have.property('consentStatus');
		expect(res.haveBeenUpdated).to.equal(false);
	});

	it('need update for privacy consent', async () => {
		const parentConsents = createParentConsent(true, true, (new Date()).setFullYear('1990'));
		const age = Configuration.get('CONSENT_AGE_FIRST') - 1;

		const testUser = await createUserWithConsent({ age, parentConsents });

		const res = await consentCheckService.find({
			route: {
				userId: testUser._id,
			},
			query: {
				simple: true,
			},
		});

		expect(res).to.have.property('haveBeenUpdated');
		expect(res).to.have.property('consentStatus');
		expect(res.haveBeenUpdated).to.equal(true);
	});

	it('need update for school consent', async () => {
		const userConsent = createUserConsent(true, true, (new Date()).setFullYear('1990'));
		const parentConsents = createParentConsent(true, true);
		const schools = await schoolSerivce.find({});
		const [{ _id: schoolId }] = schools.data;
		testObjects.createTestConsentVersion({
			schoolId,
		});
		const age = Configuration.get('CONSENT_AGE_FIRST') + 1;

		const testUser = await createUserWithConsent({
			age,
			userConsent,
			parentConsents,
			schoolId,
		});

		const res = await consentCheckService.find({
			route: {
				userId: testUser._id,
			},
		});

		// TODO: check for school consent
		expect(res).to.have.property('haveBeenUpdated');
		expect(res).to.have.property('consentStatus');
		expect(res).to.have.property('privacy');
		expect(res).to.have.property('termsOfUse');
		expect(res.haveBeenUpdated).to.equal(true);
	});
});
