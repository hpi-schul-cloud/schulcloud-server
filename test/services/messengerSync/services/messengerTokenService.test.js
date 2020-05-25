const { expect } = require('chai');
const commons = require('@schul-cloud/commons');

const { Configuration } = commons;
const nock = require('nock');
const app = require('../../../../src/app');
const testObjects = require('../../helpers/testObjects')(app);
const {
	messengerTokenService,
	messengerTokenHooks,
} = require('../../../../src/services/messengerSync/services/messengerTokenService');

describe('MessengerTokenService', function test() {
	this.timeout(10000);
	let server;

	before((done) => {
		server = app.listen(0, done);
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
				configBefore = Configuration.toObject(); // deep copy current config
				Configuration.set('FEATURE_MATRIX_MESSENGER_ENABLED', true);
				Configuration.set('MATRIX_SECRET', 'secret');
			});

			after(() => {
				Configuration.parse(configBefore);
			});

			it('can fail', async () => {
				nock(Configuration.get('MATRIX_URI'))
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
						expect(err.code).to.equals(403);
					});
			});

			it('should succeed', async () => {
				nock(Configuration.get('MATRIX_URI'))
					.post('/_matrix/client/r0/login')
					.reply(200, {
						access_token: 'token',
						device_id: 'DEVICE',
						home_server: 'messenger.schule',
					});
				const school = await testObjects.createTestSchool({ features: ['messenger'] });
				const student = await testObjects.createTestUser({ roles: ['student'], schoolId: school._id });

				const params = await testObjects.generateRequestParamsFromUser(student);
				return service
					.create({}, params)
					.then((response) => {
						expect(response).not.to.be.undefined;
						expect(response.userId).to.equals(`@sso_${student._id}:messenger.schule`);
						expect(response.homeserverUrl).to.equals(Configuration.get('MATRIX_URI'));
						expect(response.accessToken).to.equals('token');
						expect(response.deviceId).to.equals('DEVICE');
						expect(response.servername).to.equals('messenger.schule');
					});
			});
		});
	});
});
