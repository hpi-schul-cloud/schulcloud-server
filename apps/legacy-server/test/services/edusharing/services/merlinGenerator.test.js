const assert = require('assert');
const chai = require('chai');
const sinon = require('sinon');
const request = require('request-promise-native');
const appPromise = require('../../../../src/app');
const testObjects = require('../../helpers/testObjects')(appPromise);

const mockResponse =
	'http://live.download.nibis.de/refid=2255/8bNPrKXGbAYiYxadgTVe6y80FquWD6AnYcLyMiKqO2leca144Hc9GkoVomDucxLAJlXsQQkKeT4rfC4EDf3rm4OIBiIHo1PDe0w8FwvQwjo./35d590fdd29fb20a750a0934af7025a3';

describe('Merlin Token Generator', () => {
	let MerlinTokenGeneratorService;
	let app;
	let server;
	before(async () => {
		app = await appPromise;
		MerlinTokenGeneratorService = app.service('edu-sharing/merlinToken');
		server = await app.listen(0);
	});

	after(async () => {
		await testObjects.cleanup();
		await server.close();
	});

	afterEach(async () => {
		sinon.verifyAndRestore();
	});

	it('registered the service', async () => {
		assert.ok(MerlinTokenGeneratorService);
	});

	it('should thrown an error when not giving the correct query', async () => {
		try {
			await MerlinTokenGeneratorService.find({ query: { foo: 'baz' } });
		} catch (err) {
			chai.expect(err.type).to.be.equal('FeathersError');
		}
	});

	it('should return a string when requesting a url', async () => {
		try {
			const post = sinon.stub(request, 'post').returns(mockResponse);
			const result = await post(MerlinTokenGeneratorService.find({ query: { merlinReference: 'FWU-05510597' } }));
			chai.expect(result).to.be.equal(mockResponse);
		} catch (err) {
			throw new Error(err);
		}
	});

	it('should use county credentials', async () => {
		try {
			const user = await testObjects.createTestUser({ roles: ['teacher'], schoolId: '5fcfb0bc685b9af4d4abf899' });
			const params = await testObjects.generateRequestParamsFromUser(user);
			const post = sinon.stub(request, 'post').returns(mockResponse);
			params.query = { merlinReference: 'foo' };
			const result = await post(MerlinTokenGeneratorService.find(params));
			chai.expect(result).to.be.equal(mockResponse);
		} catch (err) {
			throw new Error(err);
		}
	});

	it('should use state credentials', async () => {
		try {
			const user = await testObjects.createTestUser({ roles: ['teacher'] });
			const params = await testObjects.generateRequestParamsFromUser(user);
			params.query = { merlinReference: 'foo' };
			sinon.stub(request, 'post').returns(mockResponse);
			const result = await MerlinTokenGeneratorService.find(params);
			chai.expect(result).to.be.equal(mockResponse);
		} catch (err) {
			throw new Error(err);
		}
	});
});
