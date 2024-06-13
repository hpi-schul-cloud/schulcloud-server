const chai = require('chai');
const chaiHttp = require('chai-http');
const freeport = require('freeport');
const { Configuration } = require('@hpi-schul-cloud/commons');
const decode = require('jwt-decode');
const logger = require('../../../src/logger');
const MockServer = require('./MockServer');
const appPromise = require('../../../src/app');
const testObjects = require('../helpers/testObjects')(appPromise());
const { setupNestServices, closeNestServices } = require('../../utils/setup.nest.services');

const { expect } = chai;

chai.use(chaiHttp);

function request({ server, method = 'get', endpoint, data, accessToken }) {
	return new Promise((resolve, reject) =>
		chai
			.request(server)
			[method](endpoint)
			.set({
				Accept: 'application/json',
				Authorization: accessToken,
				'Content-Type': 'application/x-www-form-urlencoded',
			})
			.send(data)
			.end((err, res) => {
				if (err) {
					reject(err);
					return;
				}
				resolve(res);
			})
	);
}

describe('Etherpad Permission Check: Teacher', () => {
	let mockServer;
	let server;
	let app;
	let nestServices;
	let configBefore;

	before((done) => {
		configBefore = Configuration.toObject({ plainSecrets: true });
		freeport(async (err, port) => {
			if (err) {
				logger.warning('freeport:', err);
			}

			const ethPath = '/api';
			const mockUrl = `http://localhost:${port}${ethPath}`;
			Configuration.set('ETHERPAD__URI', mockUrl);
			Configuration.set('ETHERPAD__API_KEY', 'someapikey');

			app = await appPromise();
			server = await app.listen(0);
			nestServices = await setupNestServices(app);

			const mock = MockServer(mockUrl, ethPath, done);
			mockServer = mock.server;
		});
	});

	after(async () => {
		await mockServer.close();
		await server.close();
		await testObjects.cleanup();
		await closeNestServices(nestServices);
		Configuration.reset(configBefore);
	});

	// reuse test result in test below at line 189
	let globalStorage = {};

	it('should have access to my pad', async () => {
		const {
			requestParams: {
				authentication: { accessToken },
			},
		} = await testObjects.setupUser({ roles: ['teacher'] });

		const jwt = decode(accessToken);
		const course = await testObjects.createTestCourse({ teacherIds: [jwt.userId] });

		const data = {
			courseId: course.id,
		};
		globalStorage = data;
		const { body } = await request({
			server: app,
			method: 'post',
			endpoint: '/etherpad/pads',
			data,
			accessToken,
		});

		expect(body.code).to.equal(0);
	});

	it('should not be able to create pad in foreign course', async () => {
		const {
			requestParams: {
				authentication: { accessToken },
			},
		} = await testObjects.setupUser({ roles: ['teacher'] });

		const { body } = await request({
			server: app,
			method: 'post',
			endpoint: '/etherpad/pads',
			data: globalStorage,
			accessToken,
		});

		expect(body.code).to.equal(403);
	});

	it('should not be able to create session for foreign course', async () => {
		const {
			requestParams: {
				authentication: { accessToken },
			},
		} = await testObjects.setupUser({ roles: ['teacher'] });

		const { body } = await request({
			server: app,
			method: 'post',
			endpoint: '/etherpad/sessions',
			data: globalStorage,
			accessToken,
		});

		expect(body.code).to.equal(403);
	});
});
