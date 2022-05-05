const { expect } = require('chai');
const appPromise = require('../../../../src/app');
const testObjects = require('../../helpers/testObjects')(appPromise);

const { setIdToken } = require('../../../../src/services/oauth2/hooks/index');

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
			expect(result.data.session.id_token.groups[0].displayName).to.match('(?=_test)_test', 'g');
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
});
