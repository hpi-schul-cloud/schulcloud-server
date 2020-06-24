const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');
const { BadRequest, Forbidden } = require('@feathersjs/errors');

const { expect } = chai;
chai.use(chaiAsPromised);

const app = require('../../../../src/app');
const {
	createTestUser,
	createTestAccount,
	createTestSystem,
	cleanup,
} = require('../../helpers/testObjects')(app);

const hookUtils = require('../../../../src/services/activation/hooks/utils');
const moodleMockServer = require('../../account/moodle/moodleMockServer');

const newTestAccount = { username: 'testMoodleLoginUser', password: 'testPassword' };

const existingTestAccount = { username: 'testMoodleLoginE', password: 'testPasswordE' };
const existingTestAccountParameters = {
	username: existingTestAccount.username,
	password: existingTestAccount.password,
};

describe('activation/hooks utils', () => {
	let server;

	before((done) => {
		server = app.listen(0, done);
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
		const account = await createTestAccount(existingTestAccountParameters, 'local', user);

		try {
			await hookUtils.validPassword({});
			throw new Error('This should never happen');
		} catch (error) {
			expect(error).to.be.instanceOf(BadRequest);
		}

		try {
			await hookUtils.validPassword({ data: { password: '' }, app });
			throw new Error('This should never happen');
		} catch (error) {
			expect(error).to.be.instanceOf(BadRequest);
		}

		try {
			await hookUtils.validPassword({ data: { password: '' }, params: { account: {} }, app });
			throw new Error('This should never happen');
		} catch (error) {
			expect(error).to.be.instanceOf(BadRequest);
		}

		try {
			await hookUtils.validPassword({ data: { password: 'adasd' }, params: { account }, app });
			throw new Error('This should never happen');
		} catch (error) {
			expect(error).to.be.instanceOf(Forbidden);
		}

		await hookUtils.validPassword(
			{
				data: {
					password: existingTestAccountParameters.password,
				},
				params: {
					account,
				},
				app,
			},
		);
	});

	it('blockThirdParty', async () => {
		const mockMoodle = await createMoodleTestServer();
		const system = await createTestSystem({ url: mockMoodle.url, type: 'moodle' });
		const user1 = await createTestUser({ roles: ['student'] });
		user1.account = await createTestAccount(existingTestAccountParameters, system, user1);

		const user2 = await createTestUser({ roles: ['student'] });
		user2.account = await createTestAccount(existingTestAccountParameters, 'local', user2);

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
			expect(error.message)
				.to.be.equal('Your user data is managed by a IDM. Changes to it can only be made in the source system');
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
			hookUtils.validateEmail(
				{ data: { email: 'test@test.de', repeatEmail: 'test@test.de123' }, params: username1.params },
			);
			throw new Error('This should never happen');
		} catch (err) {
			expect(err).to.be.instanceOf(BadRequest);
		}
		try {
			hookUtils.validateEmail(
				{ data: { email: 'testtest.de', repeatEmail: 'testtest.de' }, params: username2.params },
			);
			throw new Error('This should never happen');
		} catch (err) {
			expect(err).to.be.instanceOf(BadRequest);
		}
		hookUtils.validateEmail(
			{ data: { email: 'test@test.de', repeatEmail: 'test@test.de' }, params: username2.params },
		);
	});
});
