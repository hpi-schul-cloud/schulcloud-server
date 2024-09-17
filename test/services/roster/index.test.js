const assert = require('assert');
const chai = require('chai');
const chaiHttp = require('chai-http');

const { Configuration } = require('@hpi-schul-cloud/commons/lib');
const sinon = require('sinon');
const appPromise = require('../../../src/app');
const { FeathersRosterService } = require('../../../dist/apps/server/modules/roster/service/feathers-roster.service');

chai.use(chaiHttp);

describe('roster service', function oauth() {
	let app;
	let metadataService;
	let userGroupsService;
	let groupsService;
	let pseudonymService;
	let toolService;
	let courseService;

	this.timeout(10000);
	let server;

	let testUser1;
	let testToolTemplate;
	let testTool1;
	let testCourse;

	let pseudonym1 = null;

	before(async () => {
		app = await appPromise();
		metadataService = app.service('roster/users/:user/metadata');
		userGroupsService = app.service('roster/users/:user/groups');
		groupsService = app.service('roster/groups');
		pseudonymService = app.service('pseudonym');
		toolService = app.service('ltiTools');
		courseService = app.service('courseModel');
		server = await app.listen(0);

		testUser1 = { _id: '0000d231816abba584714c9e' }; // cord carl
		testToolTemplate = {
			_id: '5a79cb15c3874f9aea14daa6',
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
		testToolTemplate = await toolService.create(testToolTemplate);
		testTool1 = {
			_id: '5a79cb15c3874f9aea14daa5',
			name: 'test1',
			url: 'https://tool.com?pseudonym={PSEUDONYM}',
			isLocal: true,
			isTemplate: false,
			resource_link_id: 1,
			lti_version: '1p0',
			lti_message_type: 'basic-start-request',
			secret: '1',
			key: '1',
			originTool: testToolTemplate._id,
		};

		testTool1 = await toolService.create(testTool1);

		testCourse = {
			_id: '5cb8dc8e7cccac0e98a29975',
			name: 'rosterTestCourse',
			schoolId: '5f2987e020834114b8efd6f8',
			teacherIds: [testUser1._id],
			userIds: ['0000d213816abba584714c0a', '0000d224816abba584714c9c'],
			ltiToolIds: [testTool1._id],
			shareToken: 'xxx',
		};
		await courseService.create(testCourse);

		const pseudonym = await pseudonymService.find({
			query: {
				userId: testUser1._id,
				toolId: testTool1._id,
			},
		});
		pseudonym1 = pseudonym.data[0].pseudonym;
		return Promise.resolve();
	});

	afterEach(() => {
		sinon.restore();
	});

	after(() =>
		Promise.all([
			pseudonymService.remove(null, { query: {}, adapter: { multi: ['remove'] } }),
			toolService.remove(testTool1),
			toolService.remove(testToolTemplate),
			courseService.remove(testCourse._id),
		]).then(server.close())
	);

	it('is registered', () => {
		assert.ok(metadataService);
		assert.ok(userGroupsService);
		assert.ok(groupsService);
	});

	describe('GET metadata', () => {
		describe('when CTL feature is enabled', () => {
			const setup = () => {
				Configuration.set('FEATURE_CTL_TOOLS_TAB_ENABLED', true);
				const nestGetUsersMetadataStub = sinon.stub(FeathersRosterService.prototype, 'getUsersMetadata');

				return {
					nestGetUsersMetadataStub,
				};
			};

			it('should call nest feathers roster service', () => {
				const { nestGetUsersMetadataStub } = setup();

				metadataService.find({ route: { user: pseudonym1 } }).then((metadata) => {
					assert.strictEqual(pseudonym1, metadata.data.user_id);
					assert.strictEqual('teacher', metadata.data.type);
					assert.ok(nestGetUsersMetadataStub.calledOnce);
				});
			});
		});

		describe('when CTL feature is not enabled', () => {
			const setup = () => {
				Configuration.set('FEATURE_CTL_TOOLS_TAB_ENABLED', false);

				const nestGetUsersMetadataStub = sinon.stub(FeathersRosterService.prototype, 'getUsersMetadata');

				return {
					nestGetUsersMetadataStub,
				};
			};

			it('should not call nest feathers roster service', () => {
				const { nestGetUsersMetadataStub } = setup();

				metadataService.find({ route: { user: pseudonym1 } }).then(() => {
					assert.ok(nestGetUsersMetadataStub.notCalled);
				});
			});

			it('GET metadata', () => {
				setup();

				metadataService.find({ route: { user: pseudonym1 } }).then((metadata) => {
					assert.strictEqual(pseudonym1, metadata.data.user_id);
					assert.strictEqual('teacher', metadata.data.type);
				});
			});
		});
	});

	describe('GET user groups', () => {
		describe('when CTL feature is enabled', () => {
			const setup = () => {
				Configuration.set('FEATURE_CTL_TOOLS_TAB_ENABLED', true);

				const nestGetUserGroupsStub = sinon.stub(FeathersRosterService.prototype, 'getUserGroups');

				return {
					nestGetUserGroupsStub,
				};
			};

			it('should call nest feathers roster service', () => {
				const { nestGetUserGroupsStub } = setup();

				userGroupsService
					.find({
						route: { user: pseudonym1 },
						tokenInfo: { client_id: testToolTemplate.oAuthClientId },
					})
					.then(() => {
						assert.ok(nestGetUserGroupsStub.calledOnce);
					});
			});
		});

		describe('when CTL feature is not enabled', () => {
			const setup = () => {
				Configuration.set('FEATURE_CTL_TOOLS_TAB_ENABLED', false);

				const nestGetUserGroupsStub = sinon.stub(FeathersRosterService.prototype, 'getUserGroups');

				return {
					nestGetUserGroupsStub,
				};
			};

			it('should not call nest feathers roster service', () => {
				const { nestGetUserGroupsStub } = setup();

				userGroupsService
					.find({
						route: { user: pseudonym1 },
						tokenInfo: { client_id: testToolTemplate.oAuthClientId },
					})
					.then(() => {
						assert.ok(nestGetUserGroupsStub.notCalled);
					});
			});

			it('GET user groups', (done) => {
				setup();

				userGroupsService
					.find({
						route: { user: pseudonym1 },
						tokenInfo: { client_id: testToolTemplate.oAuthClientId },
					})
					.then((groups) => {
						const group1 = groups.data.groups[0];
						assert.strictEqual(testCourse._id, group1.group_id);
						assert.strictEqual(testCourse.name, group1.name);
						assert.strictEqual(testCourse.userIds.length, group1.student_count);
						done();
					});
			});
		});
	});

	describe('GET group', () => {
		describe('when CTL feature is enabled', () => {
			const setup = () => {
				Configuration.set('FEATURE_CTL_TOOLS_TAB_ENABLED', true);

				const nestGroupStub = sinon.stub(FeathersRosterService.prototype, 'getGroup');

				return {
					nestGroupStub,
				};
			};

			it('should call nest feathers roster service', () => {
				const { nestGroupStub } = setup();

				groupsService
					.get(testCourse._id, {
						tokenInfo: {
							client_id: testToolTemplate.oAuthClientId,
							obfuscated_subject: pseudonym1,
						},
					})
					.then(() => {
						assert.ok(nestGroupStub.calledOnce);
					});
			});
		});

		describe('when CTL feature is not enabled', () => {
			const setup = () => {
				Configuration.set('FEATURE_CTL_TOOLS_TAB_ENABLED', false);

				const nestGroupStub = sinon.stub(FeathersRosterService.prototype, 'getGroup');

				return {
					nestGroupStub,
				};
			};

			it('should not call nest feathers roster service', () => {
				const { nestGroupStub } = setup();

				groupsService
					.get(testCourse._id, {
						tokenInfo: {
							client_id: testToolTemplate.oAuthClientId,
							obfuscated_subject: pseudonym1,
						},
					})
					.then(() => {
						assert.ok(nestGroupStub.notCalled);
					});
			});

			it('GET group', (done) => {
				setup();

				groupsService
					.get(testCourse._id, {
						tokenInfo: {
							client_id: testToolTemplate.oAuthClientId,
							obfuscated_subject: pseudonym1,
						},
					})
					.then((group) => {
						assert.strictEqual(pseudonym1, group.data.teachers[0].user_id);
						const properties = 'title="username" style="height: 26px; width: 180px; border: none;"';
						const iframe = `<iframe src="http://localhost:3100/oauth2/username/${pseudonym1}" ${properties}></iframe>`;
						assert.strictEqual(iframe, group.data.teachers[0].username);
						done();
					});
			});
		});
	});
});
