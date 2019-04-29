const assert = require('assert');
const chai = require('chai');
const chaiHttp = require('chai-http');

const app = require('../../../src/app');

const metadataService = app.service('roster/users/:user/metadata');
const userGroupsService = app.service('roster/users/:user/groups');
const groupsService = app.service('roster/groups');
const pseudonymService = app.service('pseudonym');
const toolService = app.service('ltiTools');
const coursesService = app.service('courses');

const expect = chai.expect;
chai.use(chaiHttp);

describe('roster service', function oauth() {
	this.timeout(10000);

	const testUser1 = {
		_id: '0000d231816abba584714c9e',
	};

	const testTool1 = {
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

	const testCourse = {
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

	let pseudonym1 = null;

	before((done) => {
		this.timeout(10000);
		Promise.all([
			toolService.create(testTool1),
			coursesService.create(testCourse),
		]).then(() => {
			pseudonymService.find({
				query: {
					userId: testUser1._id,
					toolId: testTool1._id,
				},
			}).then((pseudonym) => {
				pseudonym1 = pseudonym.data[0].pseudonym;
				done();
			});
		});
	});

	after((done) => {
		Promise.all([
			pseudonymService.remove(null, { query: {} }),
			toolService.remove(testTool1),
			coursesService.remove(testCourse),
		]).then((results) => {
			done();
		});
	});

	it('is registered', () => {
		assert.ok(metadataService);
		assert.ok(userGroupsService);
		assert.ok(groupsService);
	});

	it('GET metadata', (done) => {
		metadataService.find({ route: { user: pseudonym1 } }).then((metadata) => {
			assert.strictEqual(pseudonym1, metadata.data.user_id);
			assert.strictEqual('teacher', metadata.data.type);
			done();
		});
	});

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
			done();
		});
	});
});
