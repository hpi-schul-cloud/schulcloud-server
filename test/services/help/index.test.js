const assert = require('assert');
const chai = require('chai');
const appPromise = require('../../../src/app');
const { createTestSchoolGroup, createTestSchool, createTestUser, cleanup } = require('../helpers/testObjects')(
	appPromise
);
const { generateRequestParamsFromUser } = require('../helpers/services/login')(appPromise);
const { helpDocumentsModel } = require('../../../src/services/help/model');

const { expect } = chai;


describe('help documents service', () => {
	let app;
	let helpDocumentService;
	let server;

	before(async () => {
		app = await appPromise;
		helpDocumentService = app.service('/help/documents');
		server = await app.listen(0);
	});

	after(async () => {
		await cleanup();
		await server.close();
	});

	it('registered the help documents service', () => {
		assert.ok(helpDocumentService);
	});

	it('FIND throws an error if no theme is set', async () => {
		try {
			await helpDocumentService.find({});
			throw new Error('should have failed');
		} catch (err) {
			expect(err).to.not.equal('should have failed');
			expect(err.code).to.equal(400);
			expect(err.message).to.equal('this method requires querying for a theme - query:{theme:"themename"}');
		}
	});

	it('FIND throws an error if no documents are found', async () => {
		try {
			await helpDocumentService.find({ query: { theme: 'thisThemeDoesntExist' } });
			throw new Error('should have failed');
		} catch (err) {
			expect(err).to.not.equal('should have failed');
			expect(err.code).to.equal(404);
			expect(err.message).to.equal('could not find help documents for this user or theme.');
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
		const schoolId = (await createTestSchool({ documentBaseDirType: 'school' }))._id;
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
		const helpDocument = await helpDocumentsModel.create({ schoolId, data });

		const response = await helpDocumentService.find(params);
		expect(response).to.not.equal(undefined);
		expect(Array.isArray(response)).to.equal(true);
		expect(response.length).to.equal(2);
		response.forEach((element) => {
			expect(element.title).to.equal(element.title);
			expect(element.content).to.equal(element.content);
		});
		await helpDocumentsModel.remove({ _id: helpDocument._id });
	});

	it('FIND returns valid schoolgroup document links', async () => {
		const schoolGroupId = (await createTestSchoolGroup({ name: 'FBI-schools' }))._id;
		const schoolId = (await createTestSchool({ documentBaseDirType: 'schoolGroup', schoolGroupId }))._id;
		const user = await createTestUser({ schoolId, roles: 'student' });
		const params = await generateRequestParamsFromUser(user);
		params.query = { theme: 'default' };
		const data = [
			{
				title: 'the first rule',
				content: 'the first rule of the FBI-schools: you dont talk about the FBI-schools',
			},
			{
				title: 'the second rule',
				content: 'the second rule of the FBI-schools: you dont talk about the FBI-schools',
			},
			{
				title: 'the third rule',
				content: 'the third rule of the FBI-schools: these strings are actually used as links',
			},
		];
		const helpDocument = await helpDocumentsModel.create({ schoolGroupId, data });

		const response = await helpDocumentService.find(params);
		expect(response).to.not.equal(undefined);
		expect(Array.isArray(response)).to.equal(true);
		expect(response.length).to.equal(3);
		response.forEach((element) => {
			expect(element.title).to.equal(element.title);
			expect(element.content).to.equal(element.content);
		});
		await helpDocumentsModel.remove({ _id: helpDocument._id });
	});
});
