const { expect } = require('chai');
const app = require('../../../../src/app');
const testObjects = require('../../helpers/testObjects')(app);

const classSuccessorService = app.service('classSuccessor');

describe.only('classSuccessor service', () => {
	it('is properly registered the class successor service', () => {
		expect(classSuccessorService).to.not.equal(undefined);
	});

	it('generates data for a single successor class', async () => {
		const newClass = await testObjects.createTestClass({ name: 'a2' });
		const response = await classSuccessorService.get(newClass._id);
		expect(response).to.not.equal(undefined);
	});

	after(async () => {
		await testObjects.cleanup();
	});
});
