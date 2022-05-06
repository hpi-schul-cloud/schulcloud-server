const { expect } = require('chai');
const appPromise = require('../../../../src/app');
const { Forbidden } = require('../../../../src/errors');
const testObjects = require('../../helpers/testObjects')(appPromise);

const { setIdToken, validatePermissionForNextcloud } = require('../../../../src/services/oauth2/hooks/index');

describe('oauth2 token test', () => {
	let app;
	let server;
	let createHook;

	before(async () => {
		app = await appPromise;
		server = app.listen(0);
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

	after(() => {
		server.close();
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
			const testUser = await testObjects.createTestUser();
			testUser.roles = [testRole._id];
			await app.service('users').patch(testUser._id, testUser);
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
				validatePermissionForNextcloud(createHook(testTool.oAuthClientId, testUser._id, ''));
				throw new Error('should have failed');
			} catch (err) {
				expect(err.message).to.not.equal('should have failed');
				expect(err.message).to.equal('You are not allowed to use Nextcloud');
			}
		});
	});
});
