const assert = require('assert');
const chai = require('chai');
const app = require('../../../src/app');
const {
	createTestSchool,
	createTestUser,
} = require('../helpers/testObjects')(app);
const { generateRequestParamsFromUser } = require('../helpers/services/login')(app);

const { expect } = chai;

const helpDocumentService = app.service('/help/documents');

describe.only('help documents service', () => {
	let server;

	before((done) => {
		server = app.listen(0, done);
	});

	after((done) => {
		server.close(done);
	});

	it('registered the help documents service', () => {
		assert.ok(helpDocumentService);
	});

	it('FIND returns valid default document links', async () => {
		const response = await helpDocumentService.find({ query: { theme: 'default' } });
		expect(response).to.not.equal(undefined);
		response.forEach((element) => {
			expect(element.title).to.exist;
			expect(typeof element.title).to.equal('string');
			expect(element.content).to.exist;
			expect(typeof element.content).to.equal('string');
		});
	});

	it('FIND returns valid school document links', async () => {
		const schoolId = (await createTestSchool())._id;
		const user = await createTestUser({ schoolId, roles: 'student' });
		const params = await generateRequestParamsFromUser(user);
		params.query = { theme: 'default' };
		const response = await helpDocumentService.find(params);
		expect(response).to.not.equal(undefined);
		response.forEach((element) => {
			expect(element.title).to.exist;
			expect(typeof element.title).to.equal('string');
			expect(element.content).to.exist;
			expect(typeof element.content).to.equal('string');
		});
	});
});
