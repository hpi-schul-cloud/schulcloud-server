const chai = require('chai');
const chaiHttp = require('chai-http');
const appPromise = require('../../../../src/app');
const moodleMockServer = require('./moodleMockServer');

const testObjects = require('../../helpers/testObjects')(appPromise);

const { expect } = chai;
chai.use(chaiHttp);

describe('Moodle single-sign-on', () => {
	let app;
	let testSystem = null;

	const newTestAccount = { username: 'testMoodleLoginUser1', password: 'testPassword' };

	const existingTestAccount = { username: 'testMoodleLoginExisting1', password: 'testPasswordExisting' };
	const existingTestAccountParameters = {
		username: existingTestAccount.username,
		password: existingTestAccount.password,
		token: 'oldToken',
	};

	function createMoodleTestServer() {
		return moodleMockServer({
			acceptUsers: [newTestAccount, existingTestAccount],
		});
	}

	let server;

	before(async () => {
		app = await appPromise;
		server = app.listen(0);
		const moodle = await createMoodleTestServer();
		const [system, testUser] = await Promise.all([
			testObjects.createTestSystem({ url: moodle.url, type: 'moodle' }),
			testObjects.createTestUser(),
		]);
		testSystem = system;
		const account = await testObjects.createTestAccount(existingTestAccountParameters, system, testUser);
		return account;
	});

	after(async () => {
		await testObjects.cleanup();
		await server.close();
	});

	it('should create an account for a new user who logs in with moodle', () =>
		new Promise((resolve, reject) => {
			chai
				.request(app)
				.post('/accounts')
				.set('Accept', 'application/json')
				.set('content-type', 'application/json')
				// send credentials
				.send({
					username: newTestAccount.username,
					password: newTestAccount.password,
					systemId: testSystem._id,
				})
				.end((err, res) => {
					if (err) {
						reject(err);
						return;
					}

					const account = res.body;

					expect(account).to.have.property('_id');
					expect(account.username).to.equal(newTestAccount.username.toLowerCase());
					expect(account).to.include({
						systemId: testSystem._id.toString(),
						activated: false,
					});
					resolve();
				});
		}));
});
