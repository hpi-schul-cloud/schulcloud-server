const chai = require('chai');
const chaiHttp = require('chai-http');
const app = require('../../../../src/app');
const moodleMockServer = require('./moodleMockServer');

const testObjects = require('../../helpers/testObjects')(app);

const { logger } = app;

chai.use(chaiHttp);

describe('Moodle single-sign-on', () => {
	let testSystem = null;

	const newTestAccount = { username: 'testMoodleLoginUser', password: 'testPassword' };

	const existingTestAccount = { username: 'testMoodleLoginExisting', password: 'testPasswordExisting' };
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

	before(() => createMoodleTestServer()
		.then((moodle) => {
			mockMoodle = moodle;
			return Promise.all([
				testObjects.createTestSystem({ url: moodle.url, type: 'moodle' }),
				testObjects.createTestUser()]);
		})
		.then(([system, testUser]) => {
			testSystem = system;
			return testObjects.createTestAccount(existingTestAccountParameters, system, testUser);
		}));

	it('should create an account for a new user who logs in with moodle', () => new Promise((resolve, reject) => {
		chai.request(app)
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

				account.should.have.property('_id');
				account.username.should.equal(newTestAccount.username.toLowerCase());
				account.should.include({
					systemId: testSystem._id.toString(),
					activated: false,
				});

				resolve();
			});
	}));

	after((done) => {
		testObjects.cleanup()
			.then(() => {
				done();
			})
			.catch((error) => {
				logger.error(`Could not remove test account(s): ${error}`);
				done();
			});
	});
});
