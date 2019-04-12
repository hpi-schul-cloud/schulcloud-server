const { expect } = require('chai');
const app = require('../../../../src/app');
const testObjects = require('../../helpers/testObjects')(app);

const adminStudentsService = app.service('/users/admin/students');
const classesService = app.service('/classes');
const gradeLevelService = app.service('/gradeLevels');

describe('AdminStudentsService', () => {
	let server;

	before((done) => {
		server = app.listen(0, done);
	});

	after((done) => {
		server.close(done);
	});

	it('is properly registered', () => {
		expect(adminStudentsService).to.not.equal(undefined);
	});

	it('builds class display names correctly', async () => {
		const teacher = await testObjects.createTestUser({ roles: ['teacher'] });
		const student = await testObjects.createTestUser({ roles: ['student'] });

		await testObjects.createTestClass({
			name: 'staticName',
			userIds: [student._id],
			teacherIds: [teacher._id],
		});

		const gradeLevel = (await gradeLevelService.find({
			query: { name: '2' },
		})).data[0];
		const gradeLevelClass = await testObjects.createTestClass({
			name: 'A',
			userIds: [student._id],
			teacherIds: [teacher._id],
		});
		await classesService.patch(gradeLevelClass._id, {
			nameFormat: 'gradeLevel+name',
			gradeLevel: gradeLevel._id,
		});

		const params = {
			account: {
				userId: teacher._id,
			},
		};
		const result = await adminStudentsService.find(params);

		expect(result[0].classes).to.include('staticName');
		expect(result[0].classes).to.include('2A'); // gradeLevel+name
	});

	after(async () => {
		await testObjects.cleanup();
	});
});
