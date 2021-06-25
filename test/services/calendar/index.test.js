const assert = require('assert');
const chai = require('chai');

const { expect } = chai;
const mockery = require('mockery');

const requestMock = require('./mock/mockResponses');

describe('calendar service', () => {
	let app = null;
	let calendarService = null;

	before(async () => {
		mockery.enable({
			warnOnReplace: false,
			warnOnUnregistered: false,
			useCleanCache: true,
		});
		mockery.registerMock('request-promise-native', requestMock);
		// eslint-disable-next-line global-require
		app = await require('../../../src/app');
		app.setup();
		calendarService = await app.service('calendar');
	});

	after((done) => {
		mockery.deregisterAll();
		mockery.disable();
		done();
	});

	it('registered the calendar service', () => {
		assert.ok(calendarService);
	});

	it('GET /calendar', async () => {
		const result = await calendarService.find({
			query: { all: true },
			payload: { userId: '0000d231816abba584714c9e' },
		});

		expect(result.length).to.be.above(0);
		expect(result[0].title).to.not.be.undefined;
		expect(result[0].title).to.equal('tttttt');
		expect(result[0].start).to.not.be.undefined;
		expect(result[0].start).to.equal(1495224000000);
		expect(result[0].end).to.not.be.undefined;
		expect(result[0].end).to.equal(1495224000000);
	});

	it('POST /calendar', async () => {
		const postBody = {
			summary: 'ttt',
			location: 'Paul-Gerhardt-Gymnasium',
			description: '',
			startDate: '2017-05-19T20:00:00.000Z',
			endDate: '2017-05-19T20:00:00.000Z',
			scopeId: '0000d231816abba584714c9e',
		};

		const result = await calendarService.create(postBody, { payload: { userId: '0000d231816abba584714c9e' } });
		expect(result.length).to.be.above(0);
	});

	it('PUT /calendar', async () => {
		const putBody = {
			summary: 'ttt',
			location: 'Paul-Gerhardt-Gymnasium',
			description: '',
			startDate: '2017-05-19T20:00:00.000Z',
			endDate: '2017-05-19T20:00:00.000Z',
			scopeId: '0000d231816abba584714c9e',
		};

		const result = await calendarService.update('exampleId', putBody, {
			payload: { userId: '0000d231816abba584714c9e' },
		});

		expect(result.length).to.be.above(0);
	});

	it('DELETE /calendar', async () => {
		const result = await calendarService.remove('exampleId', { payload: { userId: '0000d231816abba584714c9e' } });
		expect(result).to.not.be.undefined;
	});
});
