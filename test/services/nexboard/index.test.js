const chai = require('chai');
const chaiHttp = require('chai-http');
const app = require('../../../src/app');
const MockServer = require('./MockServer');
const { expect } = chai;

chai.use(chaiHttp);

function request({
	server,
	method = 'get',
	endpoint,
	data,
}) {
	return new Promise((resolve, reject) => (
		chai.request(server)[method](endpoint)
			.set('Accept', 'application/json')
			.set('content-type', 'application/x-www-form-urlencoded')
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
	let mockServer;
	before(async () => {
		mockServer = await MockServer({});
		process.env.NEXBOARD_MOCK_URL = mockServer.url;
	});

	it('should create a new project', async () => {
		const data = { title: 'my title', description: 'abc' };

		const { body } = await request({
			server: app,
			method: 'post',
			endpoint: '/nexboard/projects',
			data,
		});

		expect(body.title).to.equal(data.title);
		expect(body.description).to.equal(data.description);
		expect(!!body.id).to.equal(true);
	});

	it('should create a new project with default title & description', async () => {

		const { body } = await request({
			server: app,
			method: 'post',
			endpoint: '/nexboard/projects',
		});

		expect(body.title).to.be.a('string');
		expect(body.description).to.be.a('string');
		expect(body.title.length).to.be.greaterThan(0);
		expect(body.description.length).to.be.greaterThan(0);
	});

	it('should show the details of one project', async () => {

		const { body } = await request({
			server: app,
			method: 'post',
			endpoint: '/nexboard/projects',
		});

		const { body: detailedProject } = await request({
			server: app,
			endpoint: `/nexboard/projects/${body.id}`,
		});

		expect(detailedProject.title).to.be.a('string');
		expect(detailedProject.description).to.be.a('string');
		expect(detailedProject.title.length).to.be.greaterThan(0);
		expect(detailedProject.description.length).to.be.greaterThan(0);
		expect(detailedProject.boardIds).to.be.an('array');
	});

	it('should list projects', async () => {
		const { body: projects } = await request({
			server: app,
			endpoint: '/nexboard/projects',
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

		const { body: board } = await request({
			server: app,
			endpoint: '/nexboard/boards',
			method: 'post',
			data,
		});

		expect(board.title).to.equal(data.title);
		expect(board.description).to.equal(data.description);
		expect(board.projectId).to.equal(data.projectId);
	});

	it('should list multiple boards depending on a project', async () => {
		const data = {
			projectId: '1234',
		};

		const { body: boards } = await request({
			server: app,
			endpoint: `/nexboard/boards?projectId=${data.projectId}`,
		});

		expect(boards).to.be.an('array');
		expect(boards.length).to.be.greaterThan(0);
		boards.forEach((board) => {
			expect(board.projectId).to.equal(data.projectId);
		});
	});

	it('should return detailed information about one board', async () => {
		const id = '1234';
		const { body: board } = await request({
			server: app,
			endpoint: `/nexboard/boards/${id}`,
		});

		expect(board).to.be.an('object');
		expect(board.id).to.equal(id);
	});

	after((done) => {
		mockServer.server.close(done); // TODO not working atm
	});
});
