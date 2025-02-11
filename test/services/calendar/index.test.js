const assert = require('assert');
const chai = require('chai');

const { expect } = chai;
const mockery = require('mockery');

const axiosMock = () =>
	Promise.resolve({
		data: {
			links: {
				self: 'https://dbildungscloud.de:3000/events',
			},
			data: [
				{
					type: 'event',
					id: '0ef82d0a-0e20-465d-ae1e-850dc04d9432',
					attributes: {
						summary: 'tttttt',
						location: 'Paul-Gerhardt-Gymnasium',
						description: 'sdds',
						dtstart: '2017-05-19T20:00:00.000Z',
						dtend: '2017-05-19T20:00:00.000Z',
						dtstamp: '2017-05-10T06:44:24.174Z',
						uid: 'e40e1276-4a27-458c-8b64-ae549adadbc2',
					},
					relationships: {
						'scope-ids': ['0000d231816abba584714c9e'],
					},
				},
			],
		},
	});

describe('calendar service', () => {
	let app = null;
	let calendarService = null;

	before(async () => {
		mockery.enable({
			warnOnReplace: false,
			warnOnUnregistered: false,
			useCleanCache: true,
		});
		mockery.registerMock('axios', axiosMock);
		// eslint-disable-next-line global-require
		app = await require('../../../src/app')();
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
