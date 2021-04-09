const { expect } = require('chai');
const commons = require('@hpi-schul-cloud/commons');

const { Configuration } = commons;
const nock = require('nock');
const appPromise = require('../../../../src/app');
const testObjects = require('../../helpers/testObjects')(appPromise);
const {
	messengerTokenService,
	messengerTokenHooks,
} = require('../../../../src/services/messengerSync/services/messengerTokenService');

describe.only('MessengerTokenService', function test() {
	let app;
	this.timeout(10000);
	let server;

	before(async () => {
		app = await appPromise;
		server = await app.listen(0);
	});

	after(async () => {
		await testObjects.cleanup();
		await server.close();
	});

	it('should not be loaded if feature flags are not set', () => {
		expect(app.service('messengerToken')).to.be.undefined;
	});

	describe('init manually', () => {
		let service;

		before(() => {
			app.use('messengerToken', messengerTokenService);
			service = app.service('messengerToken');
			service.hooks(messengerTokenHooks);
		});

		it('should be initialized', () => {
			expect(service).not.to.be.undefined;
		});

		it('can not be used without feature flag', async () => {
			const school = await testObjects.createTestSchool({ features: ['messenger'] });
			const student = await testObjects.createTestUser({ roles: ['student'], schoolId: school._id });

			const params = await testObjects.generateRequestParamsFromUser(student);
			return service
				.create({}, params)
				.then(() => {
					expect(true).to.equals(false); // should not be reached
				})
				.catch((err) => {
					expect(err).to.not.be.undefined;
					expect(err.message).to.equals('messenger not supported on this instance');
				});
		});

		describe('with config', () => {
			let configBefore;

			before(() => {
				configBefore = Configuration.toObject({ plainSecrets: true }); // deep copy current config
				Configuration.set('FEATURE_MATRIX_MESSENGER_ENABLED', true);
				Configuration.set('MATRIX_MESSENGER__SECRET', 'secret');
			});

			after(() => {
				Configuration.parse(configBefore);
			});

			it('can fail', async () => {
				nock(Configuration.get('MATRIX_MESSENGER__URI'))
					.post('/_matrix/client/r0/login')
					.reply(403, 'Invalid Password');
				const school = await testObjects.createTestSchool({ features: ['messenger'] });
				const student = await testObjects.createTestUser({ roles: ['student'], schoolId: school._id });

				const params = await testObjects.generateRequestParamsFromUser(student);
				return service
					.create({}, params)
					.then(() => {
						expect(true).to.equals(false); // should not be reached
					})
					.catch((err) => {
						expect(err).to.not.be.undefined;
						// TODO: it toggle from time to time between code and statusCode, why i do not know..
						const status = err.code || err.statusCode;
						expect(status).to.equals(403);
					});
			});

			it('should succeed', async () => {
				nock(Configuration.get('MATRIX_MESSENGER__URI'))
					.post('/_matrix/client/r0/login')
					.reply(200, (uri, requestBody) => {
						return {
							access_token: 'token',
							device_id: requestBody.device_id,
							home_server: 'messenger.schule',
						};
					});
				const school = await testObjects.createTestSchool({ features: ['messenger'] });
				const student = await testObjects.createTestUser({ roles: ['student'], schoolId: school._id });

				const params = await testObjects.generateRequestParamsFromUser(student);
				return service.create({}, params).then((response) => {
					expect(response).not.to.be.undefined;
					expect(response.userId).to.equals(`@sso_${student._id}:messenger.schule`);
					expect(response.homeserverUrl).to.equals(Configuration.get('MATRIX_MESSENGER__URI'));
					expect(response.accessToken).to.equals('token');
					expect(response.deviceId).to.equals(`sc_${student._id}`);
					expect(response.servername).to.equals('messenger.schule');
				});
			});

			it('should succeed with custom homeserverUrl', async () => {
				const customHomeserverUrl = 'https://matrix-server.url';
				nock(Configuration.get('MATRIX_MESSENGER__URI'))
					.post('/_matrix/client/r0/login')
					.reply(200, {
						access_token: 'token',
						device_id: 'DEVICE',
						home_server: 'messenger.schule',
						well_known: {
							'm.homeserver': {
								base_url: customHomeserverUrl,
							},
						},
					});
				const school = await testObjects.createTestSchool({ features: ['messenger'] });
				const student = await testObjects.createTestUser({ roles: ['student'], schoolId: school._id });

				const params = await testObjects.generateRequestParamsFromUser(student);
				return service.create({}, params).then((response) => {
					expect(response).not.to.be.undefined;
					expect(response.userId).to.equals(`@sso_${student._id}:messenger.schule`);
					expect(response.homeserverUrl).to.equals(customHomeserverUrl);
					expect(response.accessToken).to.equals('token');
					expect(response.deviceId).to.equals('DEVICE');
					expect(response.servername).to.equals('messenger.schule');
				});
			});
		});
	});
});
