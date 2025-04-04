const chai = require('chai');
const chaiHttp = require('chai-http');
const freeport = require('freeport');
const { Configuration } = require('@hpi-schul-cloud/commons');
const jsonwebtoken = require('jsonwebtoken');
const logger = require('../../../src/logger');
const EtherpadMockServer = require('./EtherpadMockServer');
const appPromise = require('../../../src/app');
const testHelper = require('../helpers/testObjects');
const { setupNestServices, closeNestServices } = require('../../utils/setup.nest.services');

const { expect } = chai;

chai.use(chaiHttp);

function request({ server, method = 'get', endpoint, data, accessToken }) {
	return new Promise((resolve, reject) => {
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
			});
	});
}

describe('Etherpad services', () => {
	let etherpadMockServer;
	let server;
	let app;
	let nestServices;
	let configBefore;
	let testObjects;

	before((done) => {
		configBefore = Configuration.toObject({ plainSecrets: true });
		freeport(async (err, port) => {
			if (err) {
				logger.warning('freeport:', err);
			}

			const API_PATH_CONFIG = `/api`;
			const mockUrl = `http://localhost:${port}${API_PATH_CONFIG}`;
			Configuration.set('ETHERPAD__URI', mockUrl);
			Configuration.set('ETHERPAD__API_KEY', 'someapikey');

			app = await appPromise();
			server = await app.listen(0);
			nestServices = await setupNestServices(app);
			testObjects = testHelper(app);

			const mock = await EtherpadMockServer(done, mockUrl, API_PATH_CONFIG);
			etherpadMockServer = mock.server;
		});
	});

	after(async () => {
		await etherpadMockServer.close();
		await server.close();
		await testObjects.cleanup();
		await closeNestServices(nestServices);
		Configuration.reset(configBefore);
	});

	it('should create a new etherpad author', async () => {
		const {
			requestParams: {
				authentication: { accessToken },
			},
		} = await testObjects.setupUser({ roles: ['teacher'] });

		const data = {};
		const { body } = await request({
			server: app,
			method: 'post',
			endpoint: '/etherpad/authors',
			data,
			accessToken,
		});

		expect(!!body.data.authorID).to.equal(true);
	});

	it('should create a new etherpad group', async () => {
		const {
			requestParams: {
				authentication: { accessToken },
			},
		} = await testObjects.setupUser({
			roles: ['teacher'],
			permissions: ['COURSE_VIEW'],
		});

		const jwt = jsonwebtoken.decode(accessToken);
		const course = await testObjects.createTestCourse({ teacherIds: [jwt.userId] });

		const data = { courseId: course.id };

		const { body } = await request({
			server: app,
			method: 'post',
			endpoint: '/etherpad/groups',
			data,
			accessToken,
		});

		expect(!!body.data.groupID).to.equal(true);
	});

	it('should create a new pad', async () => {
		const {
			requestParams: {
				authentication: { accessToken },
			},
		} = await testObjects.setupUser({ roles: ['teacher'] });

		const jwt = jsonwebtoken.decode(accessToken);
		const course = await testObjects.createTestCourse({ userIds: [jwt.userId] });

		const data = {
			courseId: course.id,
			padName: 'test',
			text: 'Grande Mucho',
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

	it('should create a new session', async () => {
		const {
			requestParams: {
				authentication: { accessToken },
			},
		} = await testObjects.setupUser({ roles: ['teacher'] });

		const jwt = jsonwebtoken.decode(accessToken);
		const course = await testObjects.createTestCourse({ userIds: [jwt.userId] });

		const data = {
			courseId: course.id,
		};

		const { body } = await request({
			server: app,
			method: 'post',
			endpoint: '/etherpad/sessions',
			data,
			accessToken,
		});

		expect(!!body.data.sessionID).to.equal(true);
	});
});
