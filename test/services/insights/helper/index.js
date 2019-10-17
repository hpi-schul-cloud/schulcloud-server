const { expect } = require('chai');
const { ObjectId } = require('mongoose').Types;
const {
	Forbidden,
} = require('@feathersjs/errors');
const app = require('../../../../src/app');
const { createTestUser } = require('../../helpers/testObjects')(app);

const { generateRequestParamsFromUser } = require('../../helpers/services/login')(app);

const objectKeys = {
	dauOverMau: ['dauOverMau'],
	monthlyUsers: ['thisMonth', 'lastMonth'],
	weeklyUsersService: ['thisWeek', 'lastWeek'],
	weeklyActivityService: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
	weeklyActiveUsersService: ['teacherUsers', 'studentUsers', 'activeStudents', 'activeTeachers', 'activeStudentPercentage', 'activeTeacherPercentage'],
	roleActivityService: ['teacherData', 'studentData'],
	avgPageLoadedService: [],
	avgTimeToInteractiveService: [],
	uniquePageCountService: [], // wip
};

function insightsIntegrationTest(title, service, keys) {
	const dateRegex = /^(\d{4})-(\d\d)-(\d\d)T(\d\d):(\d\d):(\d\d)$/;
	describe(title, () => {
		it('Students should not have access to insights', async () => {
			const studentUser = await createTestUser({ roles: ['student'] });
			const studentParams = await generateRequestParamsFromUser(studentUser);

			try {
				await service.find(studentParams);
				expect.fail('The previous call should have failed');
			} catch (err) {
				expect(err).to.be.instanceOf(Forbidden);
			}
		});

		it('should not have access to .get', async () => {
			try {
				await service.get();
				expect.fail('The previous call should have failed');
			} catch (err) {
				expect(err).to.be.instanceOf(TypeError);
			}
		});

		it('should not have access to .create', async () => {
			try {
				await service.create();
				expect.fail('The previous call should have failed');
			} catch (err) {
				expect(err).to.be.instanceOf(TypeError);
			}
		});

		it('should not have access to .update', async () => {
			try {
				await service.update();
				expect.fail('The previous call should have failed');
			} catch (err) {
				expect(err).to.be.instanceOf(TypeError);
			}
		});

		it('should not have access to .patch', async () => {
			try {
				await service.patch();
				expect.fail('The previous call should have failed');
			} catch (err) {
				expect(err).to.be.instanceOf(TypeError);
			}
		});

		it('should not have access to .remove', async () => {
			try {
				await service.remove();
				expect.fail('The previous call should have failed');
			} catch (err) {
				expect(err).to.be.instanceOf(TypeError);
			}
		});

		it('should return query required when not provided', async () => {
			const adminUser = await createTestUser({ roles: ['administrator'] });
			const adminParams = await generateRequestParamsFromUser(adminUser);
			const result = await service.find(adminParams);

			adminParams.query = { schoolId: 'school_id' };
			const fakeParamsResult = await service.find(adminParams);

			adminParams.query = { schoolId: new ObjectId() };
			const correctParamsResult = await service.find(adminParams);

			expect(result).to.equal('query required: "schoolId" (ObjectId)');
			expect(fakeParamsResult).to.equal('query required: "schoolId" (ObjectId)');
			expect(correctParamsResult).to.not.equal('query required: "schoolId" (ObjectId)');
		});

		it('Admin should have access to insights', async () => {
			const adminUser = await createTestUser({ roles: ['administrator'] });
			const adminParams = await generateRequestParamsFromUser(adminUser);
			adminParams.query = { schoolId: '0000d186816abba584714c5f' };
			const result = await service.find(adminParams);
			const resultKeys = Object.keys(result);
			if (title.startsWith('Avg')) {
				expect(resultKeys.every((k) => dateRegex.test(k)));
			} else {
				expect(resultKeys.sort()).to.eql(keys.sort());
			}
		});

		it('Teacher should have access to insights', async () => {
			const teacherUser = await createTestUser({ roles: ['teacher'] });
			const teacherParams = await generateRequestParamsFromUser(teacherUser);
			teacherParams.query = { schoolId: '0000d186816abba584714c5f' };
			const result = await service.find(teacherParams);
			const resultKeys = Object.keys(result);
			if (title.startsWith('Avg')) {
				expect(resultKeys.every((k) => dateRegex.test(k)));
			} else {
				expect(resultKeys.sort()).to.eql(keys.sort());
			}
		});
	});
}

module.exports = { objectKeys, insightsIntegrationTest };
