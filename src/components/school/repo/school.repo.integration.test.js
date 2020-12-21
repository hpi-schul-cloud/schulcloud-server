const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');

const appPromise = require('../../../app');
const testObjects = require('../../../../test/services/helpers/testObjects')(appPromise);
const schoolRepo = require('./school.repo');
const { NotFound } = require('../../../errors');

chai.use(chaiAsPromised);
const { expect } = chai;

describe('school repository', () => {
	let app;
	let server;

	before(async () => {
		delete require.cache[require.resolve('../../../../src/app')];
		app = await appPromise;
		server = await app.listen(0);
	});

	after(async () => {
		await server.close();
	});

	afterEach(async () => {
		await testObjects.cleanup();
	});

	describe('getSchool', () => {
		it('should return school if school with given id exists', async () => {
			const school = await testObjects.createTestSchool();

			const result = await schoolRepo.getSchool(school._id);

			expect(result).to.eql(school);
		});

		it('should throw error if school with given id does not exist', async () => {
			const notExistingId = testObjects.generateObjectId();

			await expect(schoolRepo.getSchool(notExistingId)).to.be.rejectedWith(NotFound);
		});
	});

	describe('findSchools', () => {
		it('should find schools by given name', async () => {
			const SchoolToBeFoundName = 'School to be found';
			const [school1, school2, school3] = await Promise.all([
				testObjects.createTestSchool({ name: SchoolToBeFoundName }),
				testObjects.createTestSchool({ name: SchoolToBeFoundName }),
				testObjects.createTestSchool({ name: 'otherName' }),
			]);

			const result = await schoolRepo.findSchools({ name: SchoolToBeFoundName });

			expect(result).to.be.an('array').of.length(2);
			expect(result.map((school) => school._id.toString()))
				.to.include(school1._id.toString())
				.and.to.include(school2._id.toString())
				.and.not.to.include(school3._id.toString());
		});

		it('should return all schools if select criteria is left out', async () => {
			const [school1, school2, school3] = await Promise.all([
				testObjects.createTestSchool(),
				testObjects.createTestSchool(),
				testObjects.createTestSchool(),
			]);

			const result = await schoolRepo.findSchools({});

			expect(result.map((school) => school._id.toString()))
				.to.include(school1._id.toString())
				.and.to.include(school2._id.toString())
				.and.to.include(school3._id.toString());
		});
	});

	describe('updateSchool', () => {
		it('should update schools by id with new attribute', async () => {
			const school = await testObjects.createTestSchool();
			const patch = { officialSchoolNumber: 'a value' };
			const expectedSchool = { ...school, ...patch };
			delete expectedSchool.updatedAt;

			expect(school.officialSchoolNumber).to.be.undefined;

			const updatedSchool = await schoolRepo.updateSchool(school._id, patch);
			delete updatedSchool.updatedAt;
			expect(updatedSchool).to.deep.equal(expectedSchool);
		});
		it('should update schools by id with existing attribute', async () => {
			const school = await testObjects.createTestSchool();
			const patch = { name: 'updated school name' };
			const expectedSchool = { ...school, ...patch };
			delete expectedSchool.updatedAt;

			const updatedSchool = await schoolRepo.updateSchool(school._id, patch);
			delete updatedSchool.updatedAt;
			expect(updatedSchool).to.deep.equal(expectedSchool);
		});
	});
});
