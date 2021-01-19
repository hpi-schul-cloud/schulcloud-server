const { expect } = require('chai');
const { Configuration } = require('@hpi-schul-cloud/commons');
const appPromise = require('../../../../src/app');
const testObjects = require('../../helpers/testObjects')(appPromise);
const { createDateFromAge, createParentConsent, createUserConsent } = require('../utils/helper');

const createUserWithConsent = ({ age, userConsent, parentConsent, ...others }) =>
	testObjects.createTestUser({
		birthday: createDateFromAge(age),
		consent: {
			userConsent,
			parentConsents: [parentConsent],
		},
		...others,
	});

describe('consentCheck tests', () => {
	let app;
	let server;
	let consentCheckService;
	let schoolSerivce;

	before(async () => {
		app = await appPromise;
		schoolSerivce = app.service('/schools');
		consentCheckService = app.service('/consents/:userId/check');
		server = await app.listen(0);
	});

	after(async () => {
		await server.close();
	});

	afterEach(testObjects.cleanup);

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
		const parentConsent = createParentConsent(true, true, new Date().setFullYear('1990'));
		const age = Configuration.get('CONSENT_AGE_FIRST') - 1;

		const testUser = await createUserWithConsent({ age, parentConsent });

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
		const userConsent = createUserConsent(true, true);
		const parentConsent = createParentConsent(true, true);
		const schools = await schoolSerivce.find({});
		const [{ _id: schoolId }] = schools.data;
		const consentTitle = 'I accept to buy an ape';
		testObjects.createTestConsentVersion({
			title: consentTitle,
			schoolId,
			consentTypes: ['privacy', 'termsOfUse'],
		});
		const age = Configuration.get('CONSENT_AGE_FIRST') + 1;

		const testUser = await createUserWithConsent({
			age,
			userConsent,
			parentConsent,
			schoolId,
		});

		const res = await consentCheckService.find({
			route: {
				userId: testUser._id,
			},
		});

		expect(res).to.have.property('haveBeenUpdated');
		expect(res.haveBeenUpdated).to.equal(true);
		expect(res).to.have.property('consentStatus');
		expect(res).to.have.property('privacy');
		expect(res.privacy.length).to.equal(1);
		expect(res.privacy[0].title).to.equal(consentTitle);
		expect(res).to.have.property('termsOfUse');
		expect(res.termsOfUse.length).to.equal(1);
	});

	it('if have school consent, only check school consent', async () => {
		const userConsent = createUserConsent(true, true);
		const parentConsent = createParentConsent(true, true);
		const schools = await schoolSerivce.find({});
		const [{ _id: schoolId }] = schools.data;
		const consentTitle = 'I accept to buy an ape';
		const consentTitleSchool = 'One ape for each school';
		testObjects.createTestConsentVersion({
			title: consentTitleSchool,
			schoolId,
			consentTypes: ['privacy'],
		});
		testObjects.createTestConsentVersion({
			title: consentTitle,
			consentTypes: ['privacy'],
		});
		const age = Configuration.get('CONSENT_AGE_FIRST') + 1;

		const testUser = await createUserWithConsent({
			age,
			userConsent,
			parentConsent,
			schoolId,
		});

		const res = await consentCheckService.find({
			route: {
				userId: testUser._id,
			},
		});

		expect(res).to.have.property('haveBeenUpdated');
		expect(res.haveBeenUpdated).to.equal(true);
		expect(res).to.have.property('consentStatus');
		expect(res).to.have.property('privacy');
		expect(Array.isArray(res.privacy)).to.equal(true);
		expect(res.privacy.length).to.equal(1);
		expect(res.privacy[0].title).to.equal(consentTitleSchool);
		expect(res).to.have.property('termsOfUse');
		expect(res.termsOfUse.length).to.equal(0);
	});
});
