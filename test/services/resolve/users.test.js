'use strict';

const assert = require('assert');
const app = require('../../../src/app');

describe('resolve/users service', function() {
	const service = app.service('resolve/users');

	it('registered the resolve/users service', () => {
		assert.ok(service);
	});

	it('get error if id is no object id', function () {
		return service.get('123').then(_ => {
			throw new Error('was not supposed to succeed');
		}).catch(err => {
			assert(err.message.includes('Cast to ObjectId failed'));
			assert(err.name == 'BadRequest');
			assert(err.code == 400);
		});
	});

	it('get 404 if no scope (= class/course) is found', function () {
		return service.get('10006e13b101c8742dc2d123').then(_ => {
			throw new Error('was not supposed to succeed');
		}).catch(err => {
			assert(err.message.includes('No record found for id'));
			assert(err.name == 'NotFound');
			assert(err.code == 404);
		});
	});

	it('return users if scope is found', function () {
		return service.get('0000dcfbfb5c7a3f00bf21ab').then(data => {
			assert(data.data.length > 0);
		});
	});
});
