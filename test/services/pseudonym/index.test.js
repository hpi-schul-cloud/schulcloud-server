'use strict';

const assert = require('assert');
const app = require('../../../src/app');
const chai = require('chai');
const pseudonymService = app.service('pseudonym');
const toolService = app.service('ltiTools');
const expect = chai.expect;

describe('pseudonym service', function() {
	this.timeout(10000);

	const testTool1 = {
		"_id": "5a79cb15c3874f9aea14daa5",
		"name": "test1",
		"url": "https://tool.com?pseudonym={PSEUDONYM}",
		"isLocal": true,
		"isTemplate": true,
		"resource_link_id": 1,
		"lti_version": "1p0",
		"lti_message_type": "basic-start-request",
		"secret": "1",
		"key": "1",
	};
	const testTool2 = {
		"_id": "5a79cb15c3874f9aea14daa6",
		"originTool": '5a79cb15c3874f9aea14daa5',
		"name": "test2",
		"url": "https://tool.com?pseudonym={PSEUDONYM}",
		"isLocal": true,
		"resource_link_id": 1,
		"lti_version": "1p0",
		"lti_message_type": "basic-start-request",
		"secret": "1",
		"key": "1",
	};

	before(done => {
		this.timeout(10000);
		Promise.all([
			toolService.create(testTool1),
			toolService.create(testTool2)
		]).then(results => {
			done();
		});
	});

	after(done => {
		Promise.all([
			toolService.remove(testTool1),
			toolService.remove(testTool2)
		]).then(results => {
			done();
		});
	});

	it('is registered', () => {
		assert.ok(app.service('pseudonym'));
	});

	it("throws MethodNotAllowed on GET", () => {
		return pseudonymService.get('5a79cb15c3874f9aea14daa6').then(_ => {
			throw new Error('Was not supposed to succeed');
		}).catch(err => {
			assert(err.name, 'MethodNotAllowed');
			assert(err.code, 405);
		});
	});

	it("throws MethodNotAllowed on UPDATE", () => {
		return pseudonymService.update('5a79cb15c3874f9aea14daa6', {}).then(_ => {
			throw new Error('Was not supposed to succeed');
		}).catch(err => {
			assert(err.name, 'MethodNotAllowed');
			assert(err.code, 405);
		});
	});

	it("throws MethodNotAllowed on PATCH", () => {
		return pseudonymService.patch('5a79cb15c3874f9aea14daa6', {}).then(_ => {
			throw new Error('Was not supposed to succeed');
		}).catch(err => {
			assert(err.name, 'MethodNotAllowed');
			assert(err.code, 405);
		});
	});

	it("throws MethodNotAllowed on REMOVE", () => {
		return pseudonymService.remove('5a79cb15c3874f9aea14daa6').then(_ => {
			throw new Error('Was not supposed to succeed');
		}).catch(err => {
			assert(err.name, 'MethodNotAllowed');
			assert(err.code, 405);
		});
	});

	let pseudonym = '';
	it("creates missing pseudonym on FIND for derived tool", () => {
		return pseudonymService.find({
			query: {
				userId: '59ad4c412b442b7f81810285',
				toolId: testTool2._id
			}
		}).then(result => {
			pseudonym = result.data[0].pseudonym;
			expect(result.data[0].pseudonym).to.be.a('String');
		});
	});

	it("returns existing pseudonym on FIND for derived tool", () => {
		return pseudonymService.find({
			query: {
				userId: '59ad4c412b442b7f81810285',
				toolId: testTool2._id
			}
		}).then(result => {
			expect(result.data[0].pseudonym).to.eql(pseudonym);
		});
	});

	it("returns existing pseudonym on FIND for origin tool", () => {
		return pseudonymService.find({
			query: {
				userId: '59ad4c412b442b7f81810285',
				toolId: testTool1._id
			}
		}).then(result => {
			expect(result.data[0].pseudonym).to.eql(pseudonym);
		});
	});

	let pseudonyms = [];
	it("creates missing pseudonyms on FIND with multiple users", () => {
		return pseudonymService.find({
			query: {
				userId: ['599ec1688e4e364ec18ff46e',
					'599ec14d8e4e364ec18ff46d'],
				toolId: testTool1._id
			}
		}).then(result => {
			pseudonyms = result.data.map(pseudonym => pseudonym.pseudonym);
			expect(result.data[0].pseudonym).to.be.a('String');
		});
	});

	it("returns existing pseudonyms on FIND", () => {
		return pseudonymService.find({
			query: {
				userId: ['599ec1688e4e364ec18ff46e',
					'599ec14d8e4e364ec18ff46d'],
				toolId: testTool1._id
			}
		}).then(result => {
			expect(result.data[0].pseudonym).to.eql(pseudonyms[0]);
			expect(result.data[1].pseudonym).to.eql(pseudonyms[1]);
		});
	});

	it("doesn't create pseudonyms on FIND for missing users", () => {
		return pseudonymService.find({
			query: {
				userId: '599ec1688e4e364ac18ff46e', // not existing userId
				toolId: testTool1._id
			}
		}).then(result => {
			throw new Error('Was not supposed to succeed');
		}).catch(error => {
			assert(error.name, 'NotFound');
			assert(error.code, 404);
		});
	});

	it("doesn't create pseudonyms on FIND for missing tool", () => {
		return pseudonymService.find({
			query: {
				userId: '599ec1688e4e364ec18ff46e',
				toolId: '599ec1688e4e364ec18ff46e' // not existing toolId
			}
		}).then(result => {
			throw new Error('Was not supposed to succeed');
		}).catch(error => {
			assert(error.name, 'NotFound');
			assert(error.code, 404);
		});
	});
});
