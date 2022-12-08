const { expect } = require('chai');
const appPromise = require('../../../../src/app');
const { setupNestServices, closeNestServices } = require('../../../utils/setup.nest.services');
const testObjects = require('../../helpers/testObjects')(appPromise());

const { setIdToken, validatePermissionForNextcloud } = require('../../../../src/services/oauth2/hooks/index');
const {ObjectId} = require("@mikro-orm/mongodb");

describe('oauth2 token test', () => {
	let app;
	let server;
	let createHook;
	let nestServices;

	before(async () => {
		app = await appPromise();
		server = app.listen(0);
		nestServices = await setupNestServices(app);
		createHook = (clientId, userId, scopes) => ({
			app,
			params: {
				consentRequest: {
					requested_scope: scopes || '',
					client: {
						client_id: clientId,
					},
				},
				loginRequest: {
					client: {
						client_id: clientId,
					},
				},
				account: {
					userId,
				},
				query: {
					accept: true,
				},
				school: {
					features: [],
				},
			},
			data: {
				session: {},
			},
		});
	});

	after(async () => {
		await server.close();
		await closeNestServices(nestServices);
	});

	describe('when scope groups is set', () => {
		it('id_token groups should be defined', async () => {
			// Arrange
			const testTeam = await testObjects.createTestTeamWithOwner();
			const testTool = await testObjects.createTestLtiTool();

			// Act
			const result = await setIdToken(createHook(testTool.oAuthClientId, testTeam.user._id, 'groups'));

			// Assert
			expect(result).to.not.equal(undefined);
			expect(result.data.session.id_token.groups).to.not.equal(undefined);
		});

		it('id_token groups should contain teamid', async () => {
			// Arrange
			const testTeam = await testObjects.createTestTeamWithOwner();
			const testTool = await testObjects.createTestLtiTool();

			// Act
			const result = await setIdToken(createHook(testTool.oAuthClientId, testTeam.user._id, 'groups'));

			// Assert
			expect(result.data.session.id_token.groups[0].gid.toString()).to.equal(testTeam.team._id.toString());
			expect(result.data.session.id_token.groups[0].displayName).to.match(/(?=_test)_test/, 'g');
		});
	});

	describe('when scope groups is not set', () => {
		it('id_token groups should be undefined', async () => {
			// Arrange
			const testTeam = await testObjects.createTestTeamWithOwner();
			const testTool = await testObjects.createTestLtiTool();

			// Act
			const result = await setIdToken(createHook(testTool.oAuthClientId, testTeam.user._id));

			// Assert
			expect(result).to.not.equal(undefined);
			expect(result.data.session.id_token.groups).to.equal(undefined);
		});
	});

	describe('when logging into Nextcloud', () => {
		it('user has role with permission', async () => {
			// Arrange
			const testRole = await app.service('roles').create({
				name: 'testRole',
				permissions: ['NEXTCLOUD_USER'],
			});
			const testUser = await testObjects.createTestUser({ roles: [testRole._id] });
			const testTool = await testObjects.createTestLtiTool({ name: 'SchulcloudNextcloud', oAuthClientId: 'Nextcloud' });

			// Act
			const result = await validatePermissionForNextcloud(createHook(testTool.oAuthClientId, testUser._id, ''));

			// Assert
			expect(result).to.not.equal(undefined); // returned hook confirms the check passed
		});
		it('user has role without permission', async () => {
			// Arrange
			const testUser = await testObjects.createTestUser();
			const testTool = await testObjects.createTestLtiTool({ name: 'SchulcloudNextcloud', oAuthClientId: 'Nextcloud' });

			// Act and Assert
			try {
				await validatePermissionForNextcloud(createHook(testTool.oAuthClientId, testUser._id, ''));
				throw new Error('should have failed');
			} catch (err) {
				expect(err.message).to.not.equal('should have failed');
				expect(err.message).to.equal('You are not allowed to use Nextcloud');
			}
		});
	});

	describe('when scope alias is set', () => {
		it('id_token alias should be defined', async () => {
			// Arrange
			const testTool = await testObjects.createTestLtiTool();
			const testUser = await testObjects.createTestUser();

			// Act
			const result = await setIdToken(createHook(testTool.oAuthClientId, testUser._id, 'alias'));

			// Assert
			expect(result).to.not.equal(undefined);
			expect(result.data.session.id_token.alias).to.not.equal(undefined);
		});

		it('id_token alias should contain alias-name', async () => {
			// Arrange
			const testTool = await testObjects.createTestLtiTool();
			const testUser = await testObjects.createTestUser();

			// Act
			const result = await setIdToken(createHook(testTool.oAuthClientId, testUser._id, 'alias'));

			// Assert
			expect(result.data.session.id_token.alias).to.equal('Max M');
		});
	});

	describe('when scope fed_state is set', () => {
		it('id_token fed_state should be defined', async () => {
			// Arrange
			const testTool = await testObjects.createTestLtiTool();
			const testSchool = await testObjects.createTestSchool({federalState: ObjectId('0000b186816abba584714c53')});
			const testUser = await testObjects.createTestUser({schoolId: testSchool.id});

			// Act
			const result = await setIdToken(createHook(testTool.oAuthClientId, testUser._id, 'fed_state'));

			// Assert
			expect(result).to.not.equal(undefined);
			expect(result.data.session.id_token.fed_state).to.not.equal(undefined);
		});

		it('id_token fed_state should contain fed_state of the school', async () => {
			// Arrange
			const testTool = await testObjects.createTestLtiTool();
			const testSchool = await testObjects.createTestSchool({federalState: ObjectId('0000b186816abba584714c53')});
			const testUser = await testObjects.createTestUser({schoolId: testSchool.id});

			// Act
			const result = await setIdToken(createHook(testTool.oAuthClientId, testUser._id, 'fed_state'));

			// Assert
			expect(result.data.session.id_token.fed_state).to.equal('Brandenburg');
		});
	});

	describe('when scope classes is set', () => {
		it('id_token classes should be defined', async () => {
			// Arrange
			const testTool = await testObjects.createTestLtiTool();
			const testSchool = await testObjects.createTestSchool();
			const testUser = await testObjects.createTestUser({schoolId: testSchool.id});
			const testClass = await testObjects.createTestClass({schoolId: testSchool.id, userIds: [testUser.id]});

			// Act
			const result = await setIdToken(createHook(testTool.oAuthClientId, testUser._id, 'classes'));

			// Assert
			expect(result).to.not.equal(undefined);
			expect(result.data.session.id_token.classes).to.not.equal(undefined);
		});

		it('id_token classes should contain subscribed classes and role', async () => {
			// Arrange
			const testTool = await testObjects.createTestLtiTool();
			const testSchool = await testObjects.createTestSchool();
			const testUser = await testObjects.createTestUser({schoolId: testSchool.id, roles: ['student']});
			const testClass = await testObjects.createTestClass({schoolId: testSchool.id, userIds: [testUser._id]});

			// Act
			const result = await setIdToken(createHook(testTool.oAuthClientId, testUser._id, 'classes'));

			// Assert
			expect(result.data.session.id_token.classes[0].id).to.equal(testClass.id);
			expect(result.data.session.id_token.classes[0].student).to.true;
		});
	});

});
