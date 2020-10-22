const assert = require('assert');
const _ = require('lodash');
const appPromise = require('../../../src/app');

describe('resolve/users service', () => {
	let app;
	let service;

	before(async () => {
		app = await appPromise;
		service = app.service('resolve/users');
	});

	it('registered the resolve/users service', () => {
		assert.ok(service);
	});

	it('get error if no scope is found', () =>
		service
			.get('123')
			.then((_) => {
				throw new Error('was not supposed to succeed');
			})
			.catch((err) => {
				assert(err.message.includes('No scope found for given id.'));
				assert(err.name == 'NotFound');
				assert(err.code == 404);
			}));

	it('return users if scope is found', () =>
		service.get('0000dcfbfb5c7a3f00bf21ab').then((data) => {
			assert(data.data.length > 0);
			assert(data.data[0].type === 'user');
			assert(_.find(data.data, (user) => user.id === '0000d213816abba584714c0a' || '0000d231816abba584714c9e'));
		}));
});
