const assert = require('assert');
const app = require('../../../src/app');

describe('resolve/scopes service', () => {
	const service = app.service('resolve/scopes');

	it('registered the resolve/scopes service', () => {
		assert.ok(service);
	});

	it('get error if id is no object id', () => service.get('123').then((_) => {
		throw new Error('was not supposed to succeed');
	}).catch((err) => {
		assert(err.message.includes('Cast to ObjectId failed'));
		assert(err.name == 'BadRequest');
		assert(err.code == 400);
	}));

	it('get 404 if no user is found', () => service.get('00006e13b101c8742dc2d092').then((_) => {
		throw new Error('was not supposed to succeed');
	}).catch((err) => {
		assert(err.message.includes('No record found for id'));
		assert(err.name == 'NotFound');
		assert(err.code == 404);
	}));

	it('return scopes if user is found', () => service.get('0000d213816abba584714c0a').then((data) => {
		assert(data.data.length > 0);
	}));
});
