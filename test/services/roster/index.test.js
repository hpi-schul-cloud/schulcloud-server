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
	let courseService;

	let server;
	let nestServices;

	let testUser1;
	let testCourse;

	let configBefore;

	before(async () => {
		configBefore = Configuration.toObject({ plainSecrets: true }); // deep copy current config
		Configuration.set('FILES_STORAGE__SERVICE_BASE_URL', 'http://validHost:3333');

		app = await appPromise();
		metadataService = app.service('roster/users/:user/metadata');
		userGroupsService = app.service('roster/users/:user/groups');
		groupsService = app.service('roster/groups');
		courseService = app.service('courseModel');
		server = await app.listen(0);
		nestServices = await setupNestServices(app);

		testUser1 = { _id: '0000d231816abba584714c9e' }; // cord carl

		testCourse = {
			_id: new ObjectId().toHexString(),
			name: 'rosterTestCourse',
			schoolId: '5f2987e020834114b8efd6f8',
			teacherIds: [testUser1._id.toString()],
			userIds: ['0000d213816abba584714c0a', '0000d224816abba584714c9c'],
		};
		await courseService.create(testCourse);
	});

	afterEach(() => {
		sinon.restore();
	});

	after(async () => {
		Configuration.reset(configBefore);
		await Promise.all([courseService.remove(testCourse._id.toString())]);
		await server.close();
		await closeNestServices(nestServices);
	});

	describe('GET metadata', () => {
		const setup = () => {
			const nestGetUsersMetadataStub = sinon.stub(FeathersRosterService.prototype, 'getUsersMetadata');

			return {
				nestGetUsersMetadataStub,
			};
		};

		// currently metadata is always undefined - need to be fixed
		it.skip('should call nest feathers roster service', async () => {
			const { nestGetUsersMetadataStub } = setup();

			const metadata = await metadataService.find({ route: { user: 'pseudonym1' } });

			expect('teacher').to.be.equal(metadata.data.type);
			expect(nestGetUsersMetadataStub.calledOnce).to.be.equal(true);
		});
	});

	describe('GET user groups', () => {
		const setup = () => {
			const nestGetUserGroupsStub = sinon.stub(FeathersRosterService.prototype, 'getUserGroups');

			return {
				nestGetUserGroupsStub,
			};
		};

		it('should call nest feathers roster service', async () => {
			const { nestGetUserGroupsStub } = setup();

			await userGroupsService.find({
				route: { user: 'pseudonym1' },
				tokenInfo: { client_id: '123456789' },
			});

			expect(nestGetUserGroupsStub.calledOnce).to.be.equal(true);
		});
	});

	describe('GET group', () => {
		const setup = () => {
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
					client_id: '123456789',
					obfuscated_subject: 'pseudonym1',
				},
			});

			expect(nestGroupStub.calledOnce).to.be.equal(true);
		});
	});
});
