const assert = require('assert');
const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');

const { expect } = require('chai');
const { BadRequest } = require('../../../src/errors');
const appPromise = require('../../../src/app');
const globals = require('../../../config/globals');

const testObjects = require('../helpers/testObjects')(appPromise);

let consentService;
let consentVersionService;

chai.use(chaiAsPromised);

describe('consent service', () => {
	let app;
	let server;
	before(async () => {
		app = await appPromise;
		consentService = app.service('/consents');
		consentService.setup(app);
		consentVersionService = app.service('consentVersions');
		consentVersionService.setup(app);
		server = await app.listen(0);
	});

	after((done) => {
		server.close(done);
	});

	afterEach(async () => {
		await testObjects.cleanup();
	});

	it('registered the consent service', () => {
		assert.ok(consentService);
		assert.ok(consentVersionService);
	});

	it('creates consents correctly', () =>
		consentService
			.create({
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
			})
			.then((consent) => consentService.get(consent._id))
			.then((consent) => {
				chai.expect(consent).to.exist;
				chai.expect(consent.parentConsents[0]).to.have.property('dateOfPrivacyConsent');
				chai.expect(consent).to.have.property('userConsent');
			}));

	it('patches date of user consent', () =>
		consentService
			.create({
				userId: '0000d213816abba584714c0b',
			})
			.then((consent) =>
				consentService.patch(consent._id, {
					userConsent: {
						privacyConsent: true,
						termsOfUseConsent: true,
					},
				})
			)
			.then((consent) => {
				chai.expect(consent).to.have.property('userConsent');
				chai.expect(consent.userConsent).to.have.property('dateOfPrivacyConsent');
			}));

	it('it sets consent status', () => {
		const userId = '0000d213816abba584714c0b';
		consentService
			.create({
				userId,
			})
			.then(() => consentService.find({ query: { userId } }))
			.then((results) => {
				chai.expect(results.data[0]).to.have.property('consentStatus');
			});
	});

	it('patches instead of creating second consent for same user', () => {
		const userId = '58b40278dac20e0645353e3a';
		return consentService
			.create({
				userId,
			})
			.then(() =>
				consentService.create({
					userId,
					userConsent: {
						privacyConsent: true,
						termsOfUseConsent: true,
					},
				})
			)
			.then(() => consentService.find({ query: { userId } }))
			.then((results) => {
				chai.expect(results.total).to.equal(1);
				chai.expect(results.data[0]).to.have.property('userConsent');
				chai.expect(results.data[0].userConsent).to.have.property('privacyConsent');
				chai.expect(results.data[0].userConsent.privacyConsent).to.equal(true);
			});
	});

	it('finds consent versions', () =>
		consentVersionService.find({ query: { versionNumber: 'testversion' } }).then((consentVersion) => {
			chai.expect(consentVersion).to.exist;
			const specificSampleConsentVersion = consentVersion.data.filter((cv) => cv.versionNumber === 'testversion');
			chai.expect(specificSampleConsentVersion.length).to.be.equal(1);
		}));

	it('checks access on get', () =>
		consentService.find({ query: { userId: '59ae89b71f513506904e1cc9' } }).then((consent) => {
			chai.expect(consent).to.exist;
		}));

	it('consentVersionService create method should return an error if shdUpload and instance NBC', async () => {
		const superHeroUser = await testObjects.createTestUser({ roles: ['superhero'] });
		const params = await testObjects.generateRequestParamsFromUser(superHeroUser);
		const OLD_SC_THEME = globals.SC_THEME;
		globals.SC_THEME = 'n21';

		await chai
			.expect(consentVersionService.create({}, params))
			.to.be.rejectedWith(BadRequest, 'SHD consent upload is disabled for NBC instance.');

		globals.SC_THEME = OLD_SC_THEME;
	});

	it('consentVersionService create method should not return an error if shdUpload and instance different than NBC', async () => {
		const superHeroUser = await testObjects.createTestUser({ roles: ['superhero'] });
		const params = await testObjects.generateRequestParamsFromUser(superHeroUser);
		const OLD_SC_THEME = globals.SC_THEME;
		globals.SC_THEME = 'default';

		await chai
			.expect(consentVersionService.create({}, params))
			.to.not.be.rejectedWith(BadRequest, 'SHD consent upload is disabled for NBC instance.');

		globals.SC_THEME = OLD_SC_THEME;
	});

	it('consentVersionService create method should create new consent if SHD upload', async () => {
		const superHeroUser = await testObjects.createTestUser({ roles: ['superhero'] });
		const params = await testObjects.generateRequestParamsFromUser(superHeroUser);
		const OLD_SC_THEME = globals.SC_THEME;
		globals.SC_THEME = 'default';

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

		globals.SC_THEME = OLD_SC_THEME;
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
