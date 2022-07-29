const { expect } = require('chai');
const appPromise = require('../../../../src/app');
const { setupNestServices, closeNestServices } = require('../../../utils/setup.nest.services');
const testObjects = require('../../helpers/testObjects')(appPromise());
const { copyCourseFile } = require('../../../../src/services/fileStorage/utils/copyCourseFiles');

describe('copy course files', () => {
	let app;
	let server;
	let nestServices;

	before(async () => {
		app = await appPromise();
		server = await app.listen(0);
		nestServices = await setupNestServices(app);
	});

	after(async () => {
		await testObjects.cleanup();
		await server.close();
		await closeNestServices(nestServices);
	});

	it('should copy file into course', async () => {
		const { _id: schoolId } = await testObjects.createTestSchool({});
		const teacher = await testObjects.createTestUser({ roles: ['teacher'], schoolId });
		const course = await testObjects.createTestCourse();
		const storageProvider = await testObjects.createTestStorageProvider();

		const file = await testObjects.createTestFile({
			owner: teacher._id,
			refOwnerModel: 'user',
			permissions: [
				{
					write: true,
					read: true,
					create: true,
					delete: true,
					refId: teacher._id,
					refPermModel: 'user',
				},
			],
			isDirectory: false,
			storageFileName: 'undefined',
			type: 'any/type',
			size: 123,
			name: 'sample',
			bucket: 'bucket-test',
			storageProviderId: storageProvider._id,
		});

		const copy = await testObjects.createTestFile({
			owner: teacher._id,
			refOwnerModel: 'user',
			permissions: [
				{
					write: true,
					read: true,
					create: true,
					delete: true,
					refId: teacher._id,
					refPermModel: 'user',
				},
			],
			isDirectory: false,
			storageFileName: 'undefined',
			type: 'any/type',
			size: 123,
			name: 'sample',
			bucket: 'bucket-test',
			storageProviderId: storageProvider._id,
		});

		const strategy = {
			copyFile: (userId, originalStorageFileName, newStorageFileName, sourceSchoolId) => copy,
		};

		const result = await copyCourseFile(
			{ fileId: file._id, targetCourseId: course.id, userId: teacher._id, strategy },
			app
		);
		expect(result.copy.id.toString()).to.equal(copy.id.toString());
	});
});
