const assert = require('assert');
const chai = require('chai');
const appPromise = require('../../../src/app');

let consentService;
let consentVersionService;

describe('consent service', () => {
	let app;
	before(async () => {
		app = await appPromise;
		consentService = app.service('/consents');
		consentService.setup(app);
		consentVersionService = app.service('consentVersions');
		consentVersionService.setup(app);
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
});
