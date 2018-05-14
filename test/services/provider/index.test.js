'use strict';

const assert = require('assert');
const app = require('../../../src/app');
const chai = require('chai');
const providerService = app.service('provider');
const pseudonymService = app.service('pseudonym');
const toolService = app.service('ltiTools');
const courseService = app.service('courses')
const expect = chai.expect;

describe('provider service', function() {
	this.timeout(10000);

	const testTool = {
		"_id": "59a55f39a2049554a93fed16",
		"name": "test1",
		"url": "https://tool.com?pseudonym={PSEUDONYM}",
		"isLocal": true,
		"isTemplate": true,
		"oAuthClientId": "testClient"
	};
	const testUser = {
		_id: '0000d224816abba584714c9c'
	};
	const testCourseId = '0000dcfbfb5c7a3f00bf21ab';

	before(done => {
		this.timeout(10000);
		Promise.all([
			toolService.create(testTool),
			courseService.patch(testCourseId, {ltiToolIds: ['59a55f39a2049554a93fed16']})
		]).then(results => {
			done();
		});
	});

	after(done => {
		this.timeout(10000);
		Promise.all([
			toolService.remove(testTool)
		]).then(results => {
			done();
		});
	});

	it('is registered', () => {
		assert.ok(providerService);
	});

	it("returns metadata about user on FIND metadata", () => {
		return pseudonymService.find({
			query: {
				userId: testUser._id,
				toolId: testTool._id
			}
		}).then(result => {
			const token = result.data[0].token;
			return app.service('/provider/users/:token/metadata').find({
				token,
				tokenInfo: {
					sub: token
				}
			}).then(metadata => {
				expect(metadata.data.user_id).to.eql(token);
				expect(metadata.data.type).to.eql('student');
			});
		});
	});

	it("returns groups of user on FIND groups", () => {
		return pseudonymService.find({
			query: {
				userId: testUser._id,
				toolId: testTool._id
			}
		}).then(result => {
			const token = result.data[0].token;
			return app.service('/provider/users/:token/groups').find({
				token,
				tokenInfo: {
					sub: token,
					client_id: testTool.oAuthClientId
				}
			}).then(groups => {
				expect(groups.data.groups).to.be.a('Array');
				expect(groups.data.groups[0].group_id).to.eql(testCourseId);
			});
		});
	});

	// TODO: GET /provider/groups
});
