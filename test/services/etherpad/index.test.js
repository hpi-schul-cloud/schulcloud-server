const chai = require('chai');
const chaiHttp = require('chai-http');
const freeport = require('freeport');
const { Configuration } = require('@hpi-schul-cloud/commons');
const decode = require('jwt-decode');
const logger = require('../../../src/logger');
const MockServer = require('./MockServer');
const testObjects = require('../helpers/testObjects');

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

describe('Etherpad services', () => {
	let mockServer;
	let server;
	let app;
	let testHelpers;
	let configBefore;

	before(() => {
		configBefore = Configuration.toObject({ plainSecrets: true });
		freeport(async (err, port) => {
			if (err) {
				logger.warning('freeport:', err);
			}

			const API_PATH_CONFIG = Configuration.get('ETHERPAD_API_PATH');
			const mockUrl = `http://localhost:${port}${API_PATH_CONFIG}`;
			Configuration.set('ETHERPAD_URI', mockUrl);
			Configuration.set('ETHERPAD_API_KEY', 'someapikey');

			// eslint-disable-next-line global-require
			app = await require('../../../src/app');
			server = app.listen(0);
			testHelpers = testObjects(app);

			const mock = await MockServer(mockUrl, Configuration.get('ETHERPAD_API_PATH'));
			mockServer = mock.server;
		});
	});

	after(async () => {
		await mockServer.close();
		await server.close();
		Configuration.reset(configBefore);
	});

	it('should create a new etherpad author', async () => {
		const {
			requestParams: {
				authentication: { accessToken },
			},
		} = await testHelpers.setupUser({ roles: ['teacher'] });

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
		} = await testHelpers.setupUser({
			roles: ['teacher'],
			permissions: ['COURSE_VIEW'],
		});

		const jwt = decode(accessToken);
		const course = await testHelpers.createTestCourse({ teacherIds: [jwt.userId] });

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
		} = await testHelpers.setupUser({ roles: ['teacher'] });

		const jwt = decode(accessToken);
		const course = await testHelpers.createTestCourse({ userIds: [jwt.userId] });

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
		} = await testHelpers.setupUser({ roles: ['teacher'] });

		const jwt = decode(accessToken);
		const course = await testHelpers.createTestCourse({ userIds: [jwt.userId] });

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
