const chai = require('chai');
const chaiHttp = require('chai-http');
const jwt = require('jsonwebtoken');
const app = require('../../../src/app');
const testObjects = require('../helpers/testObjects')(app);

const accountService = app.service('accounts');

const { logger } = app;
const should = chai.should();

chai.use(chaiHttp);

describe('General login service', () => {
	const testAccount = {
		username: 'poweruser@mail.schul.tech',
		password: 'passwordA',
	};

	before(() => testObjects.createTestUser()
		.then((testUser) => testObjects.createTestAccount(testAccount, null, testUser)));

	it('should get a JWT which includes accountId', () => new Promise((resolve, reject) => {
		chai.request(app)
			.post('/authentication')
			.set('Accept', 'application/json')
			.set('content-type', 'application/x-www-form-urlencoded')
		// send credentials
			.send({
				username: testAccount.username,
				password: testAccount.password,
				strategy: 'local',
			})
			.end((err, res) => {
				if (err) {
					reject(err);
					return;
				}

				const decodedToken = jwt.decode(res.body.accessToken);

				// get the account id from JWT
				decodedToken.should.have.property('accountId');

				accountService.get(decodedToken.accountId)
					.then((account) => {
						account.username.should.equal(testAccount.username);
						resolve();
					})
					.catch((error) => {
						logger.error(`failed to get the account from the service: ${error}`);
						// throw error;
						reject(error);
						// done();
					});

				resolve();
			});
	}));

	it.only('should not get a JWT with wrong credentials', () => new Promise((resolve, reject) => {
		chai.request(app)
			.post('/authentication')
			.set('Accept', 'application/json')
			.set('content-type', 'application/x-www-form-urlencoded')
		// send credentials
			.send({
				username: testAccount.username,
				password: `${testAccount.password}a`,
				strategy: 'local',
			})
			.end((err, res) => {
				if (err) {
					reject(err);
					return;
				}

				const decodedToken = jwt.decode(res.body.accessToken);

				// JWT should not exist
				should.equal(decodedToken, null);

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
