const chai = require('chai');
const chaiHttp = require('chai-http');
const appPromise = require('../../../app');
const testObjects = require('../../../../test/services/helpers/testObjects')(appPromise);
const { classesRepo } = require('./index');

chai.use(chaiHttp);
const { expect } = chai;

describe('class repo', () => {
	let app;
	let server;

	before(async () => {
		app = await appPromise;
		server = await app.listen(0);
	});

	afterEach(async () => {
		await testObjects.cleanup();
	});

	after(async () => {
		await server.close();
	});

	it('should return classes', async () => {
		const { _id: schoolId } = await testObjects.createTestSchool();
		const user = await testObjects.createTestUser({ roles: ['student'], schoolId });
		const klass = await testObjects.createTestClass({ userIds: [user._id], schoolId });
		const classes = await classesRepo.find(user._id, app);
		expect(classes[0]).to.deep.equal(klass);
	});

	it('should delete user reference from classes', async () => {
		const { _id: schoolId } = await testObjects.createTestSchool();
		const user = await testObjects.createTestUser({ roles: ['student'], schoolId });
		const klass = await testObjects.createTestClass({ userIds: [user._id], schoolId });
		let classes = await classesRepo.find(user._id, app);
		expect(classes[0]).to.deep.equal(klass);
		const classIds = classes.map((cl) => cl._id);
		await classesRepo.deleteUserRef(user._id, classIds, app);
		classes = await classesRepo.find(user._id, app);
		expect(classes).to.have.length(0);
	});
});
