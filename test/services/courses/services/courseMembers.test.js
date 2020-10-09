const { expect } = require('chai');
const reqlib = require('app-root-path').require;

const { Forbidden } = reqlib('src/errors');

const appPromise = require('../../../../src/app');
const testObjects = require('../../helpers/testObjects')(appPromise);
const { generateRequestParamsFromUser } = require('../../helpers/services/login')(appPromise);

describe('course scope members service', () => {
	let app;
	let courseMembersService;
	let server;

	before(async () => {
		app = await appPromise;
		courseMembersService = app.service('/courses/:scopeId/members');
		server = app.listen(0);
	});

	after((done) => {
		server.close(done);
	});

	it('is properly registered', () => {
		expect(courseMembersService).to.not.equal(undefined);
	});

	describe('in a course without substitution teacher', () => {
		let teacher;
		let student;
		let course;

		let teacherParams;
		let studentParams;

		before(async function before() {
			this.timeout(5000);
			teacher = await testObjects.createTestUser();
			teacherParams = await generateRequestParamsFromUser(teacher);
			student = await testObjects.createTestUser();
			studentParams = await generateRequestParamsFromUser(student);
			course = await testObjects.createTestCourse({
				teacherIds: [teacher._id],
				userIds: [student._id],
			});
		});

		after(testObjects.cleanup);

		it('returns the right members', async () => {
			const response = await courseMembersService.find({ route: { scopeId: course._id } });
			expect(Object.keys(response)).to.have.members([teacher._id.toString(), student._id.toString()]);
		});

		it('assigns the correct permissions to each userId', async () => {
			const response = await courseMembersService.find({ route: { scopeId: course._id } });
			for (const userId in response) {
				if (userId === teacher._id.toString()) {
					expect(response[userId]).to.include.members(['COURSE_EDIT', 'COURSE_DELETE', 'SCOPE_PERMISSIONS_VIEW']);
				} else if (userId === student._id.toString()) {
					expect(response[userId]).to.include.members(['HOMEWORK_VIEW', 'COURSE_VIEW']);
					expect(response[userId]).to.not.include.members(['COURSE_EDIT', 'COURSE_DELETE', 'SCOPE_PERMISSIONS_VIEW']);
				}
			}
		});

		it('allows access to the teacher', async () => {
			const params = {
				...teacherParams,
				route: { scopeId: course._id },
			};
			const response = await courseMembersService.find(params);
			expect(response).to.not.equal(undefined);
		});

		it('does not allow access for students and other users', async () => {
			const params = {
				...studentParams,
				route: { scopeId: course._id },
			};
			try {
				await courseMembersService.find(params);
				throw new Error('The previous call should have failed.');
			} catch (err) {
				expect(err).to.be.instanceOf(Forbidden);
			}
		});
	});

	describe('in a course with substitution teacher', () => {
		let teachers;
		let substitutionTeachers;
		let students;
		let course;

		let teacherParams;
		let substitutionTeacherParams;
		let studentParams;

		const toId = (item) => item._id;
		const toIdString = (item) => item._id.toString();

		before(async function before() {
			this.timeout(8000);
			teachers = [await testObjects.createTestUser(), await testObjects.createTestUser()];
			substitutionTeachers = [await testObjects.createTestUser()];
			students = [
				await testObjects.createTestUser(),
				await testObjects.createTestUser(),
				await testObjects.createTestUser(),
				await testObjects.createTestUser(),
				await testObjects.createTestUser(),
				await testObjects.createTestUser(),
				await testObjects.createTestUser(),
				await testObjects.createTestUser(),
			];
			course = await testObjects.createTestCourse({
				teacherIds: teachers.map(toId),
				substitutionIds: substitutionTeachers.map(toId),
				userIds: students.map(toId),
			});
			teacherParams = await generateRequestParamsFromUser(teachers[0]);
			substitutionTeacherParams = await generateRequestParamsFromUser(substitutionTeachers[0]);
			studentParams = await generateRequestParamsFromUser(students[0]);
		});

		after(testObjects.cleanup);

		it('returns all members', async () => {
			const response = await courseMembersService.find({ route: { scopeId: course._id } });
			expect(Object.keys(response).length).to.equal(teachers.length + substitutionTeachers.length + students.length);
			expect(Object.keys(response)).to.include.members(teachers.map(toIdString));
			expect(Object.keys(response)).to.include.members(substitutionTeachers.map(toIdString));
			expect(Object.keys(response)).to.include.members(students.map(toIdString));
		});

		it('allows access to teachers and substitution teachers', async () => {
			let params = {
				...teacherParams,
				route: { scopeId: course._id },
			};
			let response = await courseMembersService.find(params);
			expect(response).to.not.equal(undefined);

			params = {
				...substitutionTeacherParams,
				route: { scopeId: course._id },
			};
			response = await courseMembersService.find(params);
			expect(response).to.not.equal(undefined);
		});

		it('does not allow access for students and other users', async () => {
			const params = {
				...studentParams,
				route: { scopeId: course._id },
			};
			try {
				await courseMembersService.find(params);
				throw new Error('The previous call should have failed.');
			} catch (err) {
				expect(err).to.be.instanceOf(Forbidden);
			}
		});
	});
});
