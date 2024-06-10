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

const request = async ({ server, method = 'get', endpoint, data, accessToken }) => {
	const response = await chai
		.request(server)
		[method](endpoint)
		.set({
			Accept: 'application/json',
			Authorization: accessToken,
			'Content-Type': 'application/x-www-form-urlencoded',
		})
		.send(data);
	return response;
};

describe('Etherpad Permission Check: Students', () => {
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
			Configuration.set('ETHERPAD_URI', mockUrl);
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

	const globalStorage = {};

	it('should be able to create session for own course', async () => {
		const {
			requestParams: {
				authentication: { accessToken },
			},
		} = await testObjects.setupUser({ roles: ['student'] });
		const jwt = decode(accessToken);
		const course = await testObjects.createTestCourse({
			userIds: [jwt.userId],
		});

		globalStorage.courseId = course.id;

		const { body } = await request({
			server: app,
			method: 'post',
			endpoint: '/etherpad/sessions',
			data: globalStorage,
			accessToken,
		});

		expect(body.code).to.equal(0);
	});

	it('should not be able to create session for foreign course', async () => {
		const {
			requestParams: {
				authentication: { accessToken },
			},
		} = await testObjects.setupUser({ roles: ['student'] });

		const { body } = await request({
			server: app,
			method: 'post',
			endpoint: '/etherpad/sessions',
			data: globalStorage,
			accessToken,
		});

		expect(body.code).to.equal(403);
	});

	it('should be able to create a pad', async () => {
		const {
			requestParams: {
				authentication: { accessToken },
			},
		} = await testObjects.setupUser({ roles: ['student'] });

		const jwt = decode(accessToken);
		const course = await testObjects.createTestCourse({
			userIds: [jwt.userId],
		});

		const data = {
			courseId: course.id,
			padName: 'testStudent',
			text: 'Grande Mucho Access Student',
		};

		const { body } = await request({
			server: app,
			method: 'post',
			endpoint: '/etherpad/pads',
			data,
			accessToken,
		});

		expect(!!body.data.padID).to.equal(true);
	});
});
