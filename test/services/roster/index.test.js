const assert = require('assert');
const chai = require('chai');
const chaiHttp = require('chai-http');

const app = require('../../../src/app');

const metadataService = app.service('roster/users/:user/metadata');
const userGroupsService = app.service('roster/users/:user/groups');
const groupsService = app.service('roster/groups');
const pseudonymService = app.service('pseudonym');
const toolService = app.service('ltiTools');
const courseService = app.service('courseModel');

chai.use(chaiHttp);

describe('roster service', function oauth() {
	this.timeout(10000);
	let server;

	let testUser1;
	let testTool1;
	let testCourse;


	let pseudonym1 = null;

	before(() => {
		server = app.listen(0);

		testUser1 = { _id: '0000d231816abba584714c9e' }; // cord carl
		testTool1 = {
			_id: '5a79cb15c3874f9aea14daa5',
			name: 'test1',
			url: 'https://tool.com?pseudonym={PSEUDONYM}',
			isLocal: true,
			isTemplate: true,
			resource_link_id: 1,
			lti_version: '1p0',
			lti_message_type: 'basic-start-request',
			secret: '1',
			key: '1',
			oAuthClientId: '123456789',
		};
		testCourse = {
			_id: '5cb8dc8e7cccac0e98a29975',
			name: 'rosterTestCourse',
			schoolId: '0000d186816abba584714c5f',
			teacherIds: [testUser1._id],
			userIds: [
				'0000d213816abba584714c0a',
				'0000d224816abba584714c9c',
			],
			ltiToolIds: [
				testTool1._id,
			],
			shareToken: 'xxx',
		};
		return Promise.all([
			toolService.create(testTool1),
			courseService.create(testCourse),
		]).then(() => pseudonymService.find({
			query: {
				userId: testUser1._id,
				toolId: testTool1._id,
			},
		}).then((pseudonym) => {
			pseudonym1 = pseudonym.data[0].pseudonym;
			return Promise.resolve();
		}));
	});

	after(() => Promise.all([
		pseudonymService.remove(null, { query: {} }),
		toolService.remove(testTool1),
		courseService.remove(testCourse._id),
	]).then(server.close()));

	it('is registered', () => {
		assert.ok(metadataService);
		assert.ok(userGroupsService);
		assert.ok(groupsService);
	});

	it('GET metadata', () => metadataService
		.find({ route: { user: pseudonym1 } })
		.then((metadata) => {
			assert.strictEqual(pseudonym1, metadata.data.user_id);
			assert.strictEqual('teacher', metadata.data.type);
		}));

	it('GET user groups', (done) => {
		userGroupsService.find({
			route: { user: pseudonym1 },
			tokenInfo: { client_id: testTool1.oAuthClientId },
		}).then((groups) => {
			const group1 = groups.data.groups[0];
			assert.strictEqual(testCourse._id, group1.group_id);
			assert.strictEqual(testCourse.name, group1.name);
			assert.strictEqual(testCourse.userIds.length, group1.student_count);
			done();
		});
	});

	it('GET group', (done) => {
		groupsService.get(testCourse._id, {
			tokenInfo: {
				client_id: testTool1.oAuthClientId,
				obfuscated_subject: pseudonym1,
			},
		}).then((group) => {
			assert.strictEqual(pseudonym1, group.data.teachers[0].user_id);
			const properties = 'title="username" style="height: 26px; width: 180px; border: none;"';
			const iframe = `<iframe src="http://localhost:3100/oauth2/username/${pseudonym1}" ${properties}></iframe>`;
			assert.strictEqual(encodeURI(iframe), group.data.teachers[0].username);
			done();
		});
	});
});
