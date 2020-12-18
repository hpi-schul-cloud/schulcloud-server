import chai from 'chai';
import chaiHttp from 'chai-http';
import freeport from 'freeport';
import { Configuration } from '@hpi-schul-cloud/commons';
import decode from 'jwt-decode';
import logger from '../../../src/logger';
import MockServer from './MockServer';
import testObjects from '../helpers/testObjects';

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

describe('Etherpad Permission Check: Students', () => {
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
			const appPromise = await import('../../../src/app');
			app = await appPromise.default;
			server = app.listen(0);
			testHelpers = testObjects(app);

			const mock = MockServer(mockUrl, Configuration.get('ETHERPAD_API_PATH'), done);
			mockServer = mock.server;
		});
	});

	after(async () => {
		await mockServer.close();
		await server.close();
		Configuration.reset(configBefore);
	});

	const globalStorage = {};

	it('should be able to create session for own course', async () => {
		const {
			requestParams: {
				authentication: { accessToken },
			},
		} = await testHelpers.setupUser({ roles: ['student'] });
		const jwt = decode(accessToken);
		const course = await testHelpers.createTestCourse({
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
		} = await testHelpers.setupUser({ roles: ['student'] });

		const { body } = await request({
			server: app,
			method: 'post',
			endpoint: '/etherpad/sessions',
			data: globalStorage,
			accessToken,
		});

		expect(body.code).to.equal(403);
	});

	it('should not be able to create a pad', async () => {
		const {
			requestParams: {
				authentication: { accessToken },
			},
		} = await testHelpers.setupUser({ roles: ['student'] });

		const data = {
			courseId: globalStorage.couseId,
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

		expect(body.code).to.equal(403);
	});
});
