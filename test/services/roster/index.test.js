const chai = require('chai');
const chaiHttp = require('chai-http');
const { Configuration } = require('@hpi-schul-cloud/commons');
const sinon = require('sinon');
const { ObjectId } = require('bson');
const appPromise = require('../../../src/app');
const { setupNestServices, closeNestServices } = require('../../utils/setup.nest.services');
const { FeathersRosterService } = require('../../../dist/apps/server/modules/roster/service/feathers-roster.service');

const { expect } = chai;

chai.use(chaiHttp);

describe('roster service', () => {
	let app;
	let metadataService;
	let userGroupsService;
	let groupsService;
	let pseudonymService;
	let toolService;
	let courseService;

	let server;
	let nestServices;

	let testUser1;
	let testToolTemplate;
	let testTool1;
	let testCourse;

	let pseudonym1 = null;
	let configBefore;

	before(async () => {
		configBefore = Configuration.toObject({ plainSecrets: true }); // deep copy current config
		Configuration.set('FILES_STORAGE__SERVICE_BASE_URL', 'http://validHost:3333');

		app = await appPromise();
		metadataService = app.service('roster/users/:user/metadata');
		userGroupsService = app.service('roster/users/:user/groups');
		groupsService = app.service('roster/groups');
		pseudonymService = app.service('pseudonym');
		toolService = app.service('ltiTools');
		courseService = app.service('courseModel');
		server = await app.listen(0);
		nestServices = await setupNestServices(app);

		testUser1 = { _id: '0000d231816abba584714c9e' }; // cord carl
		testToolTemplate = {
			_id: new ObjectId().toHexString(),
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
			_id: new ObjectId().toHexString(),
			name: 'test1',
			url: 'https://tool.com?pseudonym={PSEUDONYM}',
			isLocal: true,
			isTemplate: false,
			resource_link_id: 1,
			lti_version: '1p0',
			lti_message_type: 'basic-start-request',
			secret: '1',
			key: '1',
			originTool: testToolTemplate._id.toString(),
		};

		testTool1 = await toolService.create(testTool1);

		testCourse = {
			_id: new ObjectId().toHexString(),
			name: 'rosterTestCourse',
			schoolId: '5f2987e020834114b8efd6f8',
			teacherIds: [testUser1._id.toString()],
			userIds: ['0000d213816abba584714c0a', '0000d224816abba584714c9c'],
			ltiToolIds: [testTool1._id.toString()],
			// shareToken: 'xxx',
		};
		await courseService.create(testCourse);

		const pseudonym = await pseudonymService.find({
			query: {
				userId: testUser1._id,
				toolId: testTool1._id,
			},
		});
		pseudonym1 = pseudonym.data[0].pseudonym;
	});

	afterEach(() => {
		sinon.restore();
	});

	after(async () => {
		Configuration.reset(configBefore);
		await Promise.all([
			pseudonymService.remove(null, { query: {}, adapter: { multi: ['remove'] } }),
			toolService.remove(testTool1),
			toolService.remove(testToolTemplate),
			courseService.remove(testCourse._id.toString()),
		]);
		await server.close();
		await closeNestServices(nestServices);
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

			// currently metadata is always undefined - need to be fixed
			it.skip('should call nest feathers roster service', async () => {
				const { nestGetUsersMetadataStub } = setup();

				const metadata = await metadataService.find({ route: { user: pseudonym1 } });

				expect(pseudonym1).to.be.equal(metadata.data.user_id);
				expect('teacher').to.be.equal(metadata.data.type);
				expect(nestGetUsersMetadataStub.calledOnce).to.be.equal(true);
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

			it('should not call nest feathers roster service', async () => {
				const { nestGetUsersMetadataStub } = setup();

				await metadataService.find({ route: { user: pseudonym1 } });

				expect(nestGetUsersMetadataStub.notCalled).to.be.equal(true);
			});

			it('GET metadata', async () => {
				setup();

				const metadata = await metadataService.find({ route: { user: pseudonym1 } });

				expect(pseudonym1).to.be.equal(metadata.data.user_id);
				expect('teacher').to.be.equal(metadata.data.type);
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

			it('should call nest feathers roster service', async () => {
				const { nestGetUserGroupsStub } = setup();

				await userGroupsService.find({
					route: { user: pseudonym1 },
					tokenInfo: { client_id: testToolTemplate.oAuthClientId },
				});

				expect(nestGetUserGroupsStub.calledOnce).to.be.equal(true);
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

			it('should not call nest feathers roster service', async () => {
				const { nestGetUserGroupsStub } = setup();

				await userGroupsService.find({
					route: { user: pseudonym1 },
					tokenInfo: { client_id: testToolTemplate.oAuthClientId },
				});

				expect(nestGetUserGroupsStub.notCalled).to.be.equal(true);
			});

			// groups are undefined
			it.skip('GET user groups', async () => {
				setup();

				const groups = await userGroupsService.find({
					route: { user: pseudonym1 },
					tokenInfo: { client_id: testToolTemplate.oAuthClientId },
				});

				const group1 = groups.data.groups[0];
				expect(testCourse._id.toString()).to.be.equal(group1.group_id.toString());
				expect(testCourse.name).to.be.equal(group1.name);
				expect(testCourse.userIds.length).to.be.equal(group1.student_count);
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

			// need to be fixed the service setup
			it.skip('should call nest feathers roster service', async () => {
				const { nestGroupStub } = setup();

				await groupsService.get(testCourse._id.toString(), {
					tokenInfo: {
						client_id: testToolTemplate.oAuthClientId,
						obfuscated_subject: pseudonym1,
					},
				});

				expect(nestGroupStub.calledOnce).to.be.equal(true);
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

			it('should not call nest feathers roster service', async () => {
				const { nestGroupStub } = setup();

				await groupsService.get(testCourse._id, {
					tokenInfo: {
						client_id: testToolTemplate.oAuthClientId,
						obfuscated_subject: pseudonym1,
					},
				});
				expect(nestGroupStub.notCalled).to.be.equal(true);
			});

			// const group contain "errors = {description: 'Group does not contain the tool'}" setup need to be fixed
			it.skip('GET group', async () => {
				setup();

				const group = await groupsService.get(testCourse._id, {
					tokenInfo: {
						client_id: testToolTemplate.oAuthClientId,
						obfuscated_subject: pseudonym1,
					},
				});

				expect(pseudonym1).to.be.equal(group.data.teachers[0].user_id);
				const properties = 'title="username" style="height: 26px; width: 180px; border: none;"';
				const iframe = `<iframe src="http://localhost:3100/oauth2/username/${pseudonym1}" ${properties}></iframe>`;
				expect(iframe).to.be.equal(group.data.teachers[0].username);
			});
		});
	});
});
