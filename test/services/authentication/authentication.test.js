const { Configuration } = require('@hpi-schul-cloud/commons');
const chai = require('chai');
const chaiHttp = require('chai-http');
const jwt = require('jsonwebtoken');
const appPromise = require('../../../src/app');
const testObjects = require('../helpers/testObjects')(appPromise);

const should = chai.should();

chai.use(chaiHttp);

describe('start server', () => {
	let app;
	let accountService;

	let server;
	before(async () => {
		app = await appPromise;
		accountService = app.service('accounts');
		server = await app.listen(0);
	});

	after(async () => {
		await testObjects.cleanup();
		await server.close();
	});

	describe.only('General login service', () => {
		const testAccount = {
			username: `${Date.now()}poweruser@mail.schul.tech`,
			password: 'passwordA',
		};

		before(() =>
			testObjects.createTestUser().then((testUser) => testObjects.createTestAccount(testAccount, null, testUser))
		);

		it('should get a JWT which includes accountId and roles', async () => {
			const res = await chai
				.request(app)
				.post('/authentication')
				.set('Accept', 'application/json')
				.set('content-type', 'application/x-www-form-urlencoded')
				// send credentials
				.send({
					username: testAccount.username,
					password: testAccount.password,
					strategy: 'local',
				});

			const decodedToken = jwt.decode(res.body.accessToken);

			// get the account id from JWT
			decodedToken.should.have.property('accountId');
			decodedToken.should.have.property('roles');

			const account = await accountService.get(decodedToken.accountId);
			account.username.should.equal(testAccount.username);
		});

		it('should get a JWT when credentials are padded in spaces', async () => {
			const res = await chai
				.request(app)
				.post('/authentication')
				.set('Accept', 'application/json')
				.set('content-type', 'application/x-www-form-urlencoded')
				// send credentials
				.send({
					username: `     ${testAccount.username} `,
					password: `  ${testAccount.password} `,
					strategy: 'local',
				});

			const decodedToken = jwt.decode(res.body.accessToken);

			// get the account id from JWT
			decodedToken.should.have.property('accountId');

			const account = await accountService.get(decodedToken.accountId);
			account.username.should.equal(testAccount.username);
		});

		it('should not get a JWT with wrong credentials', () =>
			new Promise((resolve, reject) => {
				chai
					.request(app)
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

		describe('disposable email domains', () => {
			let originalConfiguration;
			before(() => {
				originalConfiguration = Configuration.get('BLOCK_DISPOSABLE_EMAIL_DOMAINS');
			});

			after(() => {
				Configuration.set('BLOCK_DISPOSABLE_EMAIL_DOMAINS', originalConfiguration);
			});

			it('should be blocked if activated', async () => {
				Configuration.set('BLOCK_DISPOSABLE_EMAIL_DOMAINS', true);
				const testDisposableAccount = {
					username: `${Date.now()}poweruser@my10minutemail.com`,
					password: 'passwordA',
				};

				await testObjects
					.createTestUser()
					.then((testUser) => testObjects.createTestAccount(testDisposableAccount, null, testUser));
				const res = await chai
					.request(app)
					.post('/authentication')
					.set('Accept', 'application/json')
					.set('content-type', 'application/x-www-form-urlencoded')
					// send credentials
					.send({
						username: testDisposableAccount.username,
						password: testDisposableAccount.password,
						strategy: 'local',
					});

				// Bad Request
				should.equal(res.status, 400);
				should.equal(res.body.message, 'EMAIL_DOMAIN_BLOCKED');
			});

			it('should not be blocked if deactivated', async () => {
				Configuration.set('BLOCK_DISPOSABLE_EMAIL_DOMAINS', false);
				const testDisposableAccount = {
					username: `${Date.now()}poweruser@my10minutemail.com`,
					password: 'passwordA',
				};

				await testObjects
					.createTestUser()
					.then((testUser) => testObjects.createTestAccount(testDisposableAccount, null, testUser));
				const res = await chai
					.request(app)
					.post('/authentication')
					.set('Accept', 'application/json')
					.set('content-type', 'application/x-www-form-urlencoded')
					// send credentials
					.send({
						username: testDisposableAccount.username,
						password: testDisposableAccount.password,
						strategy: 'local',
					});

				// Works
				should.equal(res.status, 201);
			});
		});

		after(async () => {
			await testObjects.cleanup();
		});
	});
});
