const assert = require('assert');
const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');
const { Configuration } = require('@hpi-schul-cloud/commons');
const { BadRequest } = require('../../../src/errors');
const appPromise = require('../../../src/app');
const testHelper = require('../helpers/testObjects');
const { setupNestServices, closeNestServices } = require('../../utils/setup.nest.services');

chai.use(chaiAsPromised);

const { expect } = chai;

describe('consent service', () => {
	let consentService;
	let consentVersionService;
	let app;
	let server;
	let nestServices;
	let configBefore;
	let testObjects;

	before(async () => {
		configBefore = Configuration.toObject({ plainSecrets: true });
		app = await appPromise();
		testObjects = testHelper(app);
		consentService = app.service('/consents');
		consentService.setup(app);
		consentVersionService = app.service('consentVersions');
		consentVersionService.setup(app);
		server = await app.listen(0);
		nestServices = await setupNestServices(app);
	});

	after(async () => {
		server.close();
		await closeNestServices(nestServices);
	});

	afterEach(async () => {
		Configuration.reset(configBefore);
		await testObjects.cleanup();
	});

	it('registered the consent service', () => {
		assert.ok(consentService);
		assert.ok(consentVersionService);
	});

	it('creates consents correctly', async () => {
		const createdConsent = await consentService.create({
			userId: '59ae89b71f513506904e1cc9',
			userConsent: {
				form: 'digital',
				privacyConsent: true,
				termsOfUseConsent: true,
			},
			parentConsents: [
				{
					parentId: '0000d213816abba584714c0b',
					privacyConsent: true,
					termsOfUseConsent: true,
				},
			],
		});

		const consent = await consentService.get(createdConsent._id);

		expect(consent).to.exist;
		expect(consent.parentConsents[0]).to.have.property('dateOfPrivacyConsent');
		expect(consent).to.have.property('userConsent');
	});

	it('patches date of user consent', async () => {
		const consent = await consentService.create({
			userId: '0000d213816abba584714c0b',
		});

		const patchedConsent = await consentService.patch(consent._id, {
			userConsent: {
				privacyConsent: true,
				termsOfUseConsent: true,
			},
		});

		expect(patchedConsent).to.have.property('userConsent');
		expect(patchedConsent.userConsent).to.have.property('dateOfPrivacyConsent');
	});

	it('it sets consent status', async () => {
		const userId = '0000d213816abba584714c0b';
		await consentService.create({
			userId,
		});

		const results = await consentService.find({ query: { userId } });

		expect(results.data[0]).to.have.property('consentStatus');
	});

	it('patches instead of creating second consent for same user', async () => {
		const userId = '58b40278dac20e0645353e3a';
		await consentService.create({
			userId,
		});
		await consentService.create({
			userId,
			userConsent: {
				privacyConsent: true,
				termsOfUseConsent: true,
			},
		});

		const consent = await consentService.find({ query: { userId } });

		expect(consent.total).to.equal(1);
		expect(consent.data[0]).to.have.property('userConsent');
		expect(consent.data[0].userConsent).to.have.property('privacyConsent');
		expect(consent.data[0].userConsent.privacyConsent).to.equal(true);
	});

	it('finds consent versions', async () => {
		const consentVersion = await consentVersionService.find({ query: { versionNumber: 'testversion' } });
		expect(consentVersion).to.exist;
		const specificSampleConsentVersion = consentVersion.data.filter((cv) => cv.versionNumber === 'testversion');
		expect(specificSampleConsentVersion.length).to.be.equal(1);
	});

	it('checks access on get', async () => {
		const consent = await consentService.find({ query: { userId: '59ae89b71f513506904e1cc9' } });
		expect(consent).to.exist;
	});

	it('consentVersionService create method should return an error if shdUpload and instance NBC', async () => {
		const superHeroUser = await testObjects.createTestUser({ roles: ['superhero'] });
		const params = await testObjects.generateRequestParamsFromUser(superHeroUser);
		Configuration.set('SC_THEME', 'n21');

		await expect(consentVersionService.create({}, params)).to.be.rejectedWith(
			BadRequest,
			'SHD consent upload is disabled for NBC instance.'
		);
	});

	it('consentVersionService create method should not return an error if shdUpload and instance different than NBC', async () => {
		const superHeroUser = await testObjects.createTestUser({ roles: ['superhero'] });
		const params = await testObjects.generateRequestParamsFromUser(superHeroUser);
		Configuration.set('SC_THEME', 'default');

		await expect(consentVersionService.create({}, params)).to.not.be.rejectedWith(
			BadRequest,
			'SHD consent upload is disabled for NBC instance.'
		);
	});

	it('consentVersionService create method should create new consent if SHD upload', async () => {
		const superHeroUser = await testObjects.createTestUser({ roles: ['superhero'] });
		const params = await testObjects.generateRequestParamsFromUser(superHeroUser);
		Configuration.set('SC_THEME', 'default');

		const consentParams = {
			title: 'Test title',
			publishedAt: '12.13.2020 14:45',
			consentText: 'Test text',
		};

		const result = await consentVersionService.create(consentParams, params);

		expect(result).to.not.be.null;
		expect(result).has.property('title').and.is.equal(consentParams.title);
		expect(result).has.property('publishedAt').and.is.not.null;
		expect(result).has.property('consentText').and.is.equal(consentParams.consentText);
	});

	it('consentVersionService create method should upload conset version when user is an admin', async () => {
		const adminUser = await testObjects.createTestUser({ roles: ['administrator'] });
		const params = await testObjects.generateRequestParamsFromUser(adminUser);
		const consentParams = {
			title: 'Test title',
			publishedAt: '12.13.2020 14:45',
			consentText: 'Test text',
		};

		const result = await consentVersionService.create(consentParams, params);

		expect(result).to.not.be.null;
		expect(result).has.property('title').and.is.equal(consentParams.title);
		expect(result).has.property('publishedAt').and.is.not.null;
		expect(result).has.property('consentText').and.is.equal(consentParams.consentText);
	});
});
