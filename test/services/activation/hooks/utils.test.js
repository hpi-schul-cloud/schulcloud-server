const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');
const reqlib = require('app-root-path').require;

const { BadRequest, Forbidden } = reqlib('src/errors');

const { expect } = chai;
chai.use(chaiAsPromised);

const appPromise = require('../../../../src/app');
const { createTestUser, createTestAccount, createTestSystem, cleanup } = require('../../helpers/testObjects')(
	appPromise
);

const hookUtils = require('../../../../src/services/activation/hooks/utils');
const moodleMockServer = require('../../account/moodle/moodleMockServer');

const newTestAccount = { username: 'testMoodleLoginUser', password: 'testPassword' };

const existingTestAccount = { username: 'testMoodleLoginE', password: 'testPasswordE' };
const existingTestAccountParameters = {
	username: existingTestAccount.username,
	password: existingTestAccount.password,
};

describe('activation/hooks utils', () => {
	let app;
	let server;

	before(async () => {
		app = await appPromise;
		server = await app.listen(0);
	});

	after(async () => {
		await cleanup();
		await server.close();
	});

	function createMoodleTestServer() {
		return moodleMockServer({
			acceptUsers: [newTestAccount, existingTestAccount],
		});
	}

	it('validPassword', async () => {
		const user = await createTestUser({ roles: ['student'] });
		const credentials = { username: user.email, password: user.email };
		const account = await createTestAccount(credentials, 'local', user);

		try {
			await hookUtils.validPassword({
				data: {
					password: credentials.password,
				},
				params: {
					account,
				},
				app,
			});
		} catch (error) {
			expect(error).to.be.instanceOf(Forbidden);
		}
	});

	it('blockThirdParty', async () => {
		const mockMoodle = await createMoodleTestServer();
		const system = await createTestSystem({ url: mockMoodle.url, type: 'moodle' });
		const user1 = await createTestUser({ roles: ['student'] });
		user1.account = await createTestAccount(existingTestAccountParameters, system, user1);

		const user2 = await createTestUser({ roles: ['student'] });
		const credentials = { username: user2.email, password: user2.email };
		user2.account = await createTestAccount(credentials, 'local', user2);

		const params = (user) => ({
			account: {
				userId: user.account,
				...user.account,
			},
		});

		try {
			await hookUtils.blockThirdParty({ app, params: params(user1) });
			throw new Error('This should never happen');
		} catch (error) {
			expect(error).to.be.instanceOf(Forbidden);
			expect(error.message).to.be.equal(
				'Your user data is managed by a IDM. Changes to it can only be made in the source system'
			);
		}

		await hookUtils.blockThirdParty({ app, params: params(user2) });
	});

	it('validateEmail', async () => {
		const username1 = {
			params: {
				account: {
					username: 'test@test.de',
				},
			},
		};
		const username2 = {
			params: {
				account: {
					username: 'oldtest@test.de',
				},
			},
		};
		try {
			hookUtils.validateEmail({});
			throw new Error('This should never happen');
		} catch (err) {
			expect(err).to.be.instanceOf(BadRequest);
		}
		try {
			hookUtils.validateEmail({ data: { email: '' }, params: username1.params });
			throw new Error('This should never happen');
		} catch (err) {
			expect(err).to.be.instanceOf(BadRequest);
		}
		try {
			hookUtils.validateEmail({ data: { email: 'test@test.de' }, params: username1.params });
			throw new Error('This should never happen');
		} catch (err) {
			expect(err).to.be.instanceOf(BadRequest);
		}
		try {
			hookUtils.validateEmail({
				data: { email: 'test@test.de', repeatEmail: 'test@test.de123' },
				params: username1.params,
			});
			throw new Error('This should never happen');
		} catch (err) {
			expect(err).to.be.instanceOf(BadRequest);
		}
		try {
			hookUtils.validateEmail({ data: { email: 'testtest.de', repeatEmail: 'testtest.de' }, params: username2.params });
			throw new Error('This should never happen');
		} catch (err) {
			expect(err).to.be.instanceOf(BadRequest);
		}
		hookUtils.validateEmail({ data: { email: 'test@test.de', repeatEmail: 'test@test.de' }, params: username2.params });
	});
});
