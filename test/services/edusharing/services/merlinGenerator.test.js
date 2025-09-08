const chai = require('chai');
const { Configuration } = require('@hpi-schul-cloud/commons');
const appPromise = require('../../../../src/app');
const testHelper = require('../../helpers/testObjects');
const MerlinTokenGenerator = require('../../../../src/services/edusharing/services/MerlinTokenGenerator');
const { setupNestServices, closeNestServices } = require('../../../utils/setup.nest.services');

const { expect } = chai;

const mockResponse =
	'http://live.download.nibis.de/refid=2255/8bNPrKXGbAYiYxadgTVe6y80FquWD6AnYcLyMiKqO2leca144Hc9GkoVomDucxLAJlXsQQkKeT4rfC4EDf3rm4OIBiIHo1PDe0w8FwvQwjo./35d590fdd29fb20a750a0934af7025a3';

describe('Merlin Token Generator', () => {
	let merlinTokenService;
	let app;
	let server;
	let nestServices;
	let configBefore;
	let testObjects;
	let ES_MERLIN_AUTH_URL;

	before(async () => {
		app = await appPromise();
		testObjects = testHelper(app);
		server = await app.listen(0);
		nestServices = await setupNestServices(app);
		merlinTokenService = app.service('edu-sharing-merlinToken');

		const mockPostRequest = (_options) => mockResponse;
		MerlinTokenGenerator.post = mockPostRequest;

		configBefore = Configuration.toObject({ plainSecrets: true });
	});

	after(async () => {
		await testObjects.cleanup();
		await server.close();
		await closeNestServices(nestServices);
	});

	afterEach(() => {
		Configuration.reset(configBefore);
	});

	const setupConfig = () => {
		Configuration.set('FEATURE_ES_MERLIN_ENABLED', true);
		Configuration.set(
			'SECRET_ES_MERLIN_COUNTIES_CREDENTIALS',
			'[{"countyId":3256,"merlinUser":"dummy","secretMerlinKey":"dummy"}]'
		);
		Configuration.set('SECRET_ES_MERLIN_USERNAME', 'merlin-username');
		Configuration.set('SECRET_ES_MERLIN_PW', 'merlin-pass');
	};

	it('should thrown an error when not giving the correct query', async () => {
		setupConfig();

		const params = { query: { foo: 'baz' } };

		await expect(merlinTokenService.find(params)).to.be.rejected;
	});

	it('should use county credentials', async () => {
		setupConfig();
		const schoolId = '5fcfb0bc685b9af4d4abf899';
		const user = await testObjects.createTestUser({ roles: ['teacher'], schoolId });
		const params = await testObjects.generateRequestParamsFromUser(user);
		params.query = { merlinReference: 'foo' };
		params.authentication.payload = { schoolId };

		const result = await merlinTokenService.find(params);

		expect(result).to.be.equal(mockResponse);
	});

	it('should return a string when requesting a url', async () => {
		setupConfig();
		Configuration.set('FEATURE_ES_MERLIN_ENABLED', false);
		ES_MERLIN_AUTH_URL = 'https://validHost:4444.de';
		Configuration.set('ES_MERLIN_AUTH_URL', ES_MERLIN_AUTH_URL);

		const params = { query: { merlinReference: 'FWU-05510597' } };

		const url = await merlinTokenService.find(params);

		expect(url).to.be.equal(ES_MERLIN_AUTH_URL);
	});

	it('should use state credentials', async () => {
		setupConfig();

		const schoolId = '5fcfb0bc685b9af4d4abf899';
		const user = await testObjects.createTestUser({ roles: ['teacher'], schoolId });
		const params = await testObjects.generateRequestParamsFromUser(user);
		params.query = { merlinReference: 'foo' };
		params.authentication.payload = { schoolId };

		const result = await merlinTokenService.find(params);
		expect(result).to.be.equal(mockResponse);
	});
});
