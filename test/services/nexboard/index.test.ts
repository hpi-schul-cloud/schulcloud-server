import chai from 'chai';
import chaiHttp from 'chai-http';
import freeport from 'freeport';
import { Configuration } from '@hpi-schul-cloud/commons';
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

describe('Nexboard services', () => {
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

			const mockUrl = `http://localhost:${port}`;
			Configuration.set('NEXBOARD_URL', mockUrl);
			Configuration.set('NEXBOARD_API_KEY', 'someapikey');
			Configuration.set('NEXBOARD_USER_ID', 'someuserid');
			const appImport = await import('../../../src/app');
			app = await appImport.default;
			server = app.listen(0);
			testHelpers = testObjects(app);

			const mock = await MockServer(mockUrl, Configuration.get('NEXBOARD_URI'));
			mockServer = mock.server;
		});
	});

	after(async () => {
		await mockServer.close();
		await server.close();
		Configuration.reset(configBefore);
	});

	it('should create a new project', async () => {
		const {
			requestParams: {
				authentication: { accessToken },
			},
		} = await testHelpers.setupUser({ roles: ['teacher'] });

		const data = { title: 'my title', description: 'abc' };

		const { body } = await request({
			server: app,
			method: 'post',
			endpoint: '/nexboard/projects',
			data,
			accessToken,
		});

		expect(body.title).to.equal(data.title);
		expect(body.description).to.equal(data.description);
		expect(!!body.id).to.equal(true);
	});

	it('should create a new project with default title & description', async () => {
		const {
			requestParams: {
				authentication: { accessToken },
			},
		} = await testHelpers.setupUser({ roles: ['teacher'] });

		const { body } = await request({
			server: app,
			method: 'post',
			endpoint: '/nexboard/projects',
			accessToken,
		});

		expect(body.title).to.be.a('string');
		expect(body.description).to.be.a('string');
		expect(body.title.length).to.be.greaterThan(0);
		expect(body.description.length).to.be.greaterThan(0);
	});

	it('should show the details of one project', async () => {
		const {
			requestParams: {
				authentication: { accessToken },
			},
		} = await testHelpers.setupUser({ roles: ['teacher'] });

		const { body } = await request({
			server: app,
			method: 'post',
			endpoint: '/nexboard/projects',
			accessToken,
		});

		const { body: detailedProject } = await request({
			server: app,
			endpoint: `/nexboard/projects/${body.id}`,
			accessToken,
		});

		expect(detailedProject.title).to.be.a('string');
		expect(detailedProject.description).to.be.a('string');
		expect(detailedProject.title.length).to.be.greaterThan(0);
		expect(detailedProject.description.length).to.be.greaterThan(0);
		expect(detailedProject.boardIds).to.be.an('array');
	});

	it('should list projects', async () => {
		const {
			requestParams: {
				authentication: { accessToken },
			},
		} = await testHelpers.setupUser({ roles: ['teacher'] });

		const { body: projects } = await request({
			server: app,
			endpoint: '/nexboard/projects',
			accessToken,
		});

		expect(projects).to.be.an('array');
		expect(projects.length).to.be.greaterThan(0);
	});

	it('should create a board with a project id', async () => {
		const {
			requestParams: {
				authentication: { accessToken },
			},
		} = await testHelpers.setupUser({ roles: ['teacher'] });

		const data = {
			title: '1',
			description: '2',
			projectId: '1234',
		};

		const { body: board } = await request({
			server: app,
			endpoint: '/nexboard/boards',
			method: 'post',
			data,
			accessToken,
		});

		expect(board.title).to.equal(data.title);
		expect(board.description).to.equal(data.description);
		expect(board.projectId).to.equal(data.projectId);
	});

	it('should list multiple boards depending on a project', async () => {
		const {
			requestParams: {
				authentication: { accessToken },
			},
		} = await testHelpers.setupUser({ roles: ['teacher'] });

		const data = {
			projectId: '1234',
		};

		const { body: boards } = await request({
			server: app,
			endpoint: `/nexboard/boards?projectId=${data.projectId}`,
			accessToken,
		});

		expect(boards).to.be.an('array');
		expect(boards.length).to.be.greaterThan(0);
		boards.forEach((board) => {
			expect(board.projectId).to.equal(data.projectId);
		});
	});

	it('should return detailed information about one board', async () => {
		const {
			requestParams: {
				authentication: { accessToken },
			},
		} = await testHelpers.setupUser({ roles: ['teacher'] });

		const id = '1234';
		const { body: board } = await request({
			server: app,
			endpoint: `/nexboard/boards/${id}`,
			accessToken,
		});

		expect(board).to.be.an('object');
		expect(board.id).to.equal(id);
	});

	it('Find should need TOOL_VIEW permission.', async () => {
		const name = `${Date.now()}testRole`;
		await testHelpers.createTestRole({ name, permissions: [] });

		const {
			requestParams: {
				authentication: { accessToken },
			},
		} = await testHelpers.setupUser({ roles: [name] });

		const data = {
			title: '1',
			description: '2',
			projectId: '1234',
		};

		const { body } = await request({
			server: app,
			endpoint: '/nexboard/boards',
			method: 'get',
			data,
			accessToken,
		});

		expect(body.code).to.equal(403);
	});

	it('Get should need TOOL_VIEW permission.', async () => {
		const name = `${Date.now()}testRole`;
		await testHelpers.createTestRole({ name, permissions: [] });

		const {
			requestParams: {
				authentication: { accessToken },
			},
		} = await testHelpers.setupUser({ roles: [name] });

		const data = {
			title: '1',
			description: '2',
			projectId: '1234',
		};

		const { body } = await request({
			server: app,
			endpoint: '/nexboard/boards/123',
			method: 'get',
			data,
			accessToken,
		});

		expect(body.code).to.equal(403);
	});

	it('Create should need TOOL_CREATE permission.', async () => {
		const {
			requestParams: {
				authentication: { accessToken },
			},
		} = await testHelpers.setupUser({ roles: ['student'] });

		const data = {
			title: '1',
			description: '2',
			projectId: '1234',
		};

		const { body } = await request({
			server: app,
			endpoint: '/nexboard/boards',
			method: 'post',
			data,
			accessToken,
		});

		expect(body.code).to.equal(403);
	});

	it('Patch should be blocked.', async () => {
		const {
			requestParams: {
				authentication: { accessToken },
			},
		} = await testHelpers.setupUser({ roles: ['student'] });

		const data = {
			title: '1',
			description: '2',
			projectId: '1234',
		};

		const { body } = await request({
			server: app,
			endpoint: '/nexboard/boards/123',
			method: 'patch',
			data,
			accessToken,
		});

		expect(body.code).to.equal(405);
	});

	it('DELETE should be blocked.', async () => {
		const {
			requestParams: {
				authentication: { accessToken },
			},
		} = await testHelpers.setupUser({ roles: ['student'] });

		const { body } = await request({
			server: app,
			endpoint: '/nexboard/boards/123',
			method: 'delete',
			accessToken,
		});

		expect(body.code).to.equal(405);
	});

	it('UPDATE should be blocked.', async () => {
		const {
			requestParams: {
				authentication: { accessToken },
			},
		} = await testHelpers.setupUser({ roles: ['student'] });

		const data = {
			title: '1',
			description: '2',
			projectId: '1234',
		};

		const { body } = await request({
			server: app,
			endpoint: '/nexboard/boards/123',
			method: 'put',
			data,
			accessToken,
		});

		expect(body.code).to.equal(405);
	});
});
