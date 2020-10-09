const assert = require('assert');
const chai = require('chai');
const sinon = require('sinon');
const request = require('request-promise-native');
const appPromise = require('../../../../src/app');

const mockResponse =
	'http://live.download.nibis.de/refid=2255/8bNPrKXGbAYiYxadgTVe6y80FquWD6AnYcLyMiKqO2leca144Hc9GkoVomDucxLAJlXsQQkKeT4rfC4EDf3rm4OIBiIHo1PDe0w8FwvQwjo./35d590fdd29fb20a750a0934af7025a3';

describe('Merlin Token Generator', () => {
	let MerlinTokenGeneratorService;
	let app;
	before(async () => {
		app = await appPromise;
		MerlinTokenGeneratorService = app.service('edu-sharing/merlinToken');
	});

	after((done) => {
		done();
	});

	it('registered the service', async () => {
		assert.ok(MerlinTokenGeneratorService);
	});

	it('should thrown an error when not giving the correct query', async () => {
		try {
			const response = await MerlinTokenGeneratorService.find({ query: { foo: 'baz' } });
		} catch (err) {
			chai.expect(err.type).to.be.equal('FeathersError');
		}
	});

	it('should return a string when requesting a url', async () => {
		try {
			const get = sinon.stub(request, 'get').returns(mockResponse);
			const result = await get(MerlinTokenGeneratorService.find({ query: { merlinReference: 'FWU-05510597' } }));
			chai.expect(result).to.be.equal(mockResponse);
			request.get.restore();
		} catch (err) {
			throw new Error(err);
		}
	});
});
