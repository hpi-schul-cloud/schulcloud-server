const assert = require('assert');
const chai = require('chai');
const app = require('../../../src/app');
const { createTestSchool, createTestUser } = require('../helpers/testObjects')(app);
const { generateRequestParamsFromUser } = require('../helpers/services/login')(app);
const { helpDocumentsModel } = require('../../../src/services/help/model');

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

	it('FIND throws an error if no documents are found', async () => {
		try {
			await helpDocumentService.find({ query: { theme: 'thisThemeDoesntExist' } });
			throw new Error('should have failed');
		} catch (err) {
			expect(err).to.not.equal('should have failed');
			expect(err.code).to.equal(404);
		}
	});

	it('FIND returns valid default document links', async () => {
		const response = await helpDocumentService.find({ query: { theme: 'default' } });
		expect(response).to.not.equal(undefined);
		expect(Array.isArray(response)).to.equal(true);
		expect(response.length).to.be.greaterThan(0);
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
		const data = [
			{
				title: 'welcome',
				content: 'somelink',
			},
			{
				title: 'unnecessary explanations',
				content: 'another link',
			},
		];
		await helpDocumentsModel.create({ schoolId, data });

		const response = await helpDocumentService.find(params);
		expect(response).to.not.equal(undefined);
		expect(Array.isArray(response)).to.equal(true);
		expect(response.length).to.equal(2);
		response.forEach((element) => {
			/* eslint-disable no-underscore-dangle */
			expect(element.title).to.equal(data[element.__index].title);
			expect(element.content).to.equal(data[element.__index].content);
			/* eslint-enable no-underscore-dangle */
		});
	});
});
