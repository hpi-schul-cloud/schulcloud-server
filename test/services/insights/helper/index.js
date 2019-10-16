const { expect } = require('chai');
const {
	NotAuthenticated,
	BadRequest,
	Forbidden,
} = require('@feathersjs/errors');
const app = require('../../../../src/app');
const { cleanup, createTestUser, testObjects } = require('../../helpers/testObjects')(app);

const {
	createTestSchool,
} = require('../../helpers/testObjects')(app);

const { generateRequestParamsFromUser } = require('../../helpers/services/login')(app);


const objectKeys = {
	dauOverMau: ['dauOverMau'],
	monthlyUsers: ['thisMonth', 'lastMonth'],
	weeklyUsersService: ['thisWeek', 'lastWeek'],
	weeklyActivityService: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'],
	weeklyActiveUsersService: ['teacherUsers', 'studentUsers', 'activeStudents', 'activeTeachers', 'activeStudentPercentage', 'activeTeacherPercentage'],
	roleActivityService: ['teacherData', 'studentData'],
};


function insightsTestingFunction(title, service, keys) {
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
			const result = await service.find();
			expect(result).to.equal('query required: schoolId');
		});

		it('Admin should have access to insights', async () => {
			const adminUser = await createTestUser({ roles: ['administrator'] });
			const adminParams = await generateRequestParamsFromUser(adminUser, 'school_id');
			adminParams.query = { schoolId: 'school_id' };
			const result = await service.find(adminParams);
			const resultKeys = Object.keys(result);
			expect(resultKeys).to.eql(keys);
		});

		it('Teacher should have access to insights', async () => {
			const teacherUser = await createTestUser({ roles: ['teacher'] });
			const teacherParams = await generateRequestParamsFromUser(teacherUser);
			teacherParams.query = { schoolId: 'school_id' };
			const result = await service.find(teacherParams);
			const resultKeys = Object.keys(result);
			expect(resultKeys).to.eql(keys);
		});
	});
}

module.exports = { objectKeys, insightsTestingFunction };
