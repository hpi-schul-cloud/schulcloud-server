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

describe('Etherpad Permission Check: Teacher', () => {
	let mockServer;
	let server;
	let app;
	let testHelpers;
	let configBefore;

	before((done) => {
		configBefore = Configuration.toObject({ plainSecrets: true });
		freeport(async (err, port) => {
			if (err) {
				logger.warning('freeport:', err);
			}

			const ethPath = Configuration.get('ETHERPAD_API_PATH');
			const mockUrl = `http://localhost:${port}${ethPath}`;
			Configuration.set('ETHERPAD_URI', mockUrl);
			Configuration.set('ETHERPAD_API_KEY', 'someapikey');

			// eslint-disable-next-line global-require
			app = await require('../../../src/app');
			server = app.listen(0);
			testHelpers = testObjects(app);

			const mock = MockServer(mockUrl, Configuration.get('ETHERPAD_API_PATH'), done);
			mockServer = mock.server;
		});
	});

	after(async () => {
		await testHelpers.cleanup();
		await mockServer.close();
		await server.close();
		Configuration.reset(configBefore);
	});

	// reuse test result in test below at line 189
	let globalStorage = {};

	it('should have access to my pad', async () => {
		const {
			requestParams: {
				authentication: { accessToken },
			},
		} = await testHelpers.setupUser({ roles: ['teacher'] });

		const jwt = decode(accessToken);
		const course = await testHelpers.createTestCourse({ teacherIds: [jwt.userId] });

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
		} = await testHelpers.setupUser({ roles: ['teacher'] });

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
		} = await testHelpers.setupUser({ roles: ['teacher'] });

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
