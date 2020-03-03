const chai = require('chai');
const chaiHttp = require('chai-http');
const freeport = require('freeport');

const logger = require('../../../src/logger');
const MockServer = require('./MockServer');
const testObjects = require('../helpers/testObjects');

const { expect } = chai;

chai.use(chaiHttp);

function request({
	server,
	method = 'get',
	endpoint,
	data,
	accessToken,
}) {
	return new Promise((resolve, reject) => (
		chai.request(server)[method](endpoint)
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
	));
}

describe('Nexboard services', () => {
	let mockServer;
	let server;
	let app;
	let testHelpers;
	let memoryUrl;

	before((done) => {
		freeport((err, port) => {
			if (err) {
				logger.warning('freeport:', err);
			}

			// eslint-disable-next-line global-require
			app = require('../../../src/app');
			server = app.listen(0);
			testHelpers = testObjects(app);

			const mockUrl = `localhost:${port}/`;
			// TODO: app.Config.data.NEXBOARD_MOCK_URL;
			memoryUrl = process.env.NEXBOARD_MOCK_URL;
			process.env.NEXBOARD_MOCK_URL = `http://${mockUrl}`;
			logger.info('set process.env.NEXBOARD_MOCK_URL', {
				NEXBOARD_MOCK_URL: process.env.NEXBOARD_MOCK_URL,
			});

			({ server: mockServer } = MockServer({
				resolver: done,
				url: mockUrl,
				port,
			}));
		});
	});

	after(async () => {
		process.env.NEXBOARD_MOCK_URL = memoryUrl;
		logger.info('set process.env.NEXBOARD_MOCK_URL', {
			NEXBOARD_MOCK_URL: process.env.NEXBOARD_MOCK_URL,
		});
		await mockServer.close();
		await server.close();
	});

	it('should create a new project', async () => {
		const {
			requestParams: { authentication: { accessToken } },
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
			requestParams: { authentication: { accessToken } },
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
			requestParams: { authentication: { accessToken } },
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
			requestParams: { authentication: { accessToken } },
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
			requestParams: { authentication: { accessToken } },
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
			requestParams: { authentication: { accessToken } },
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
			requestParams: { authentication: { accessToken } },
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
});
