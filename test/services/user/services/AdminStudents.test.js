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

	it('sorts students correctly', async () => {
		const teacher = await testObjects.createTestUser({ roles: ['teacher'] });
		await testObjects.createTestUser({ firstName: 'Max', roles: ['student'] });
		await testObjects.createTestUser({ firstName: 'Moritz', roles: ['student'] });

		const params = {
			account: {
				userId: teacher._id,
			},
			$sort: {
				firstName: -1,
			},
		};
		const result = await adminStudentsService.find(params);

		expect(result[0].firstName >= result[1].firstName);
	});

	it('filters students correctly', async () => {
		const teacher = await testObjects.createTestUser({ roles: ['teacher'] });
		const student = await testObjects.createTestUser({ roles: ['student'] });

		const paramsMissing = {
			account: {
				userId: teacher._id,
			},
			query: {
				consentStatus: {
					$in: ['missing'],
				},
			},
		};
		const paramsOk = {
			account: {
				userId: teacher._id,
			},
			query: {
				consentStatus: {
					$in: ['ok'],
				},
			},
		};
		const resultMissing = await adminStudentsService.find(paramsMissing);
		const idsMissing = resultMissing.map(e => e._id);
		const resultOk = await adminStudentsService.find(paramsOk);
		const idsOk = resultOk.map(e => e._id);

		expect(idsMissing).to.include(student._id);
		expect(idsOk).to.not.include(student._id);
	});

	after(async () => {
		await testObjects.cleanup();
	});
});
