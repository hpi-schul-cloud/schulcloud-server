const assert = require('assert');
const { expect } = require('chai');
const app = require('../../../src/app');

const timelineService = app.service('timelines');
const timelineFetchService = app.service('timelines');

const urlFields = ['fetchUrl', 'documentUrl'];
const userIds = {
	//student: '0000d225816abba584714c9d',
	//teacher: '0000d231816abba584714c9f',
	admin: '0000d213816abba584714caa',
	superhero: '0000d231816abba584714c9a',
};


// eslint-disable-next-line func-names
describe('timelines service', function () {
	this.timeout(10000);

	it('registered the timelines service', () => {
		assert.ok(timelineService);
	});

	it('registered the timelines/fetch service', () => {
		assert.ok(timelineFetchService);
	});

	it('only superhero can get urls', () => {
		const testRequests = Object.keys(userIds).map((userRole) => {
			const get = timelineService.get('5c10e6650a4fa048c4c596dd', {
				account: { userId: userIds[userRole] },
			}).then((result) => {
				urlFields.forEach((field) => {
					if (userRole === 'superhero') {
						expect(result[field]).to.not.equal(undefined);
					} else {
						expect(result[field]).to.equal(undefined);
					}
				});
			});
			const find = timelineService.find({
				query: { _id: '5c10e6650a4fa048c4c596dd' },
				account: { userId: userIds[userRole] },
			}).then((result) => {
				const { data } = result;
				data.forEach((timeline) => {
					urlFields.forEach((field) => {
						if (userRole === 'superhero') {
							expect(timeline[field]).to.not.equal(undefined);
						} else {
							expect(timeline[field]).to.equal(undefined);
						}
					});
				});
			});
			return Promise.all([get, find]);
		});
		return Promise.all(testRequests);
	});
});
