const chai = require('chai');
const chaiHttp = require('chai-http');
const MockServer = require('./MockServer');
const { getAccessToken } = require('../helpers/login');

const { expect } = chai;

chai.use(chaiHttp);

function nexboardRequest({
	server,
	method = 'get',
	endpoint,
	data,
	token,
}) {
	return new Promise((resolve, reject) => (
		chai.request(server)[method](endpoint)
			.set({
				Accept: 'application/json',
				Authorization: `Bearer ${token}`,
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

describe('Nexboard endpoints', () => {

	let nexboardMockServer;
	let nexboardApp;
	let nexboardToken;
	before(async () => {
		nexboardApp = require('../../../src/app');
		nexboardToken = await getAccessToken({
			username: 'lehrer@schul-cloud.org',
			password: 'Schulcloud1!',
		});
		nexboardMockServer = await MockServer({});
		process.env.NEXBOARD_MOCK_URL = nexboardMockServer.url;
	});

	it('should create a new project', async () => {
		const data = { title: 'my title', description: 'abc' };

		const { body } = await nexboardRequest({
			server: nexboardApp,
			method: 'post',
			endpoint: '/nexboard/projects',
			data,
			token: nexboardToken,
		});

		expect(body.title).to.equal(data.title);
		expect(body.description).to.equal(data.description);
		expect(!!body.id).to.equal(true);
	});

	it('should create a new project with default title & description', async () => {

		const { body } = await nexboardRequest({
			server: nexboardApp,
			method: 'post',
			endpoint: '/nexboard/projects',
			token: nexboardToken,
		});

		expect(body.title).to.be.a('string');
		expect(body.description).to.be.a('string');
		expect(body.title.length).to.be.greaterThan(0);
		expect(body.description.length).to.be.greaterThan(0);
	});

	it('should show the details of one project', async () => {

		const { body } = await nexboardRequest({
			server: nexboardApp,
			method: 'post',
			endpoint: '/nexboard/projects',
			token: nexboardToken,
		});

		const { body: detailedProject } = await nexboardRequest({
			server: nexboardApp,
			endpoint: `/nexboard/projects/${body.id}`,
			token: nexboardToken,
		});

		expect(detailedProject.title).to.be.a('string');
		expect(detailedProject.description).to.be.a('string');
		expect(detailedProject.title.length).to.be.greaterThan(0);
		expect(detailedProject.description.length).to.be.greaterThan(0);
		expect(detailedProject.boardIds).to.be.an('array');
	});

	it('should list projects', async () => {
		const { body: projects } = await nexboardRequest({
			server: nexboardApp,
			endpoint: '/nexboard/projects',
			token: nexboardToken,
		});

		expect(projects).to.be.an('array');
		expect(projects.length).to.be.greaterThan(0);
	});

	it('should create a board with a project id', async () => {
		const data = {
			title: '1',
			description: '2',
			projectId: '1234',
		};

		const { body: board } = await nexboardRequest({
			server: nexboardApp,
			endpoint: '/nexboard/boards',
			method: 'post',
			data,
			token: nexboardToken,
		});

		expect(board.title).to.equal(data.title);
		expect(board.description).to.equal(data.description);
		expect(board.projectId).to.equal(data.projectId);
	});

	it('should list multiple boards depending on a project', async () => {
		const data = {
			projectId: '1234',
		};

		const { body: boards } = await nexboardRequest({
			server: nexboardApp,
			endpoint: `/nexboard/boards?projectId=${data.projectId}`,
			token: nexboardToken,
		});

		expect(boards).to.be.an('array');
		expect(boards.length).to.be.greaterThan(0);
		boards.forEach((board) => {
			expect(board.projectId).to.equal(data.projectId);
		});
	});

	it('should return detailed information about one board', async () => {
		const id = '1234';
		const { body: board } = await nexboardRequest({
			server: nexboardApp,
			endpoint: `/nexboard/boards/${id}`,
			token: nexboardToken,
		});

		expect(board).to.be.an('object');
		expect(board.id).to.equal(id);
	});

	after((done) => {
		nexboardMockServer.server.close(done); // TODO not working atm
	});
});
