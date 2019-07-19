const { expect } = require('chai');
const app = require('../../../../src/app');
const testObjects = require('../../helpers/testObjects')(app);
const { generateRequestParamsFromUser } = require('../../helpers/services/login')(app);

const courseScopeListService = app.service('/users/:scopeId/courses');

describe('courses scopelist service', () => {
	it('is properly registered', () => {
		expect(courseScopeListService).to.not.equal(undefined);
	});

	it('fetches only active courses by default', async () => {
		const user = await testObjects.createTestUser();
		const activeCourse = await testObjects.createTestCourse({
			userIds: [user._id],
			untilDate: Date.now() + 600000,
		});
		const archivedCourse = await testObjects.createTestCourse({
			userIds: [user._id],
			untilDate: Date.now() - 600000,
		});
		const response = await courseScopeListService.find({ route: { scopeId: user._id }, query: {} });
		expect(response).to.not.equal(undefined);
		expect(response.total).to.equal(1);
		expect(response.data).to.not.equal(undefined);
		const courseIds = response.data.map(course => course._id.toString());
		expect(courseIds.includes(activeCourse._id.toString())).to.equal(true);
		expect(courseIds.includes(archivedCourse._id.toString())).to.equal(false);
	});

	it('may explicitly fetch only active courses', async () => {
		const user = await testObjects.createTestUser();
		const activeCourse = await testObjects.createTestCourse({
			userIds: [user._id],
			untilDate: Date.now() + 600000,
		});
		const archivedCourse = await testObjects.createTestCourse({
			userIds: [user._id],
			untilDate: Date.now() - 600000,
		});
		const response = await courseScopeListService.find({
			route: { scopeId: user._id },
			query: { filter: 'active' },
		});
		expect(response).to.not.equal(undefined);
		expect(response.total).to.equal(1);
		expect(response.data).to.not.equal(undefined);
		const courseIds = response.data.map(course => course._id.toString());
		expect(courseIds.includes(activeCourse._id.toString())).to.equal(true);
		expect(courseIds.includes(archivedCourse._id.toString())).to.equal(false);
	});

	it('may fetch only archived courses', async () => {
		const user = await testObjects.createTestUser();
		const activeCourse = await testObjects.createTestCourse({
			userIds: [user._id],
			untilDate: Date.now() + 600000,
		});
		const archivedCourse = await testObjects.createTestCourse({
			userIds: [user._id],
			untilDate: Date.now() - 600000,
		});
		const response = await courseScopeListService.find({
			route: { scopeId: user._id },
			query: { filter: 'archived' },
		});
		expect(response).to.not.equal(undefined);
		expect(response.total).to.equal(1);
		expect(response.data).to.not.equal(undefined);
		const courseIds = response.data.map(course => course._id.toString());
		expect(courseIds.includes(activeCourse._id.toString())).to.equal(false);
		expect(courseIds.includes(archivedCourse._id.toString())).to.equal(true);
	});

	it('may fetch all courses', async () => {
		const user = await testObjects.createTestUser();
		const activeCourse = await testObjects.createTestCourse({
			userIds: [user._id],
			untilDate: Date.now() + 600000,
		});
		const archivedCourse = await testObjects.createTestCourse({
			userIds: [user._id],
			untilDate: Date.now() - 600000,
		});
		const response = await courseScopeListService.find({
			route: { scopeId: user._id },
			query: { filter: 'all' },
		});
		expect(response).to.not.equal(undefined);
		expect(response.total).to.equal(2);
		expect(response.data).to.not.equal(undefined);
		const courseIds = response.data.map(course => course._id.toString());
		expect(courseIds.includes(activeCourse._id.toString())).to.equal(true);
		expect(courseIds.includes(archivedCourse._id.toString())).to.equal(true);
	});

	it('fetches only courses as student/teacher by default', async () => {
		const user = await testObjects.createTestUser();
		const courseAsStudent = await testObjects.createTestCourse({
			userIds: [user._id],
			untilDate: Date.now() + 600000,
		});
		const courseAsTeacher = await testObjects.createTestCourse({
			teacherIds: [user._id],
			untilDate: Date.now() + 600000,
		});
		const courseAsSubstitutionTeacher = await testObjects.createTestCourse({
			substitutionIds: [user._id],
			untilDate: Date.now() + 600000,
		});
		const response = await courseScopeListService.find({
			route: { scopeId: user._id },
			query: {},
		});
		expect(response).to.not.equal(undefined);
		expect(response.total).to.equal(2);
		expect(response.data).to.not.equal(undefined);
		const courseIds = response.data.map(course => course._id.toString());
		expect(courseIds.includes(courseAsStudent._id.toString())).to.equal(true);
		expect(courseIds.includes(courseAsTeacher._id.toString())).to.equal(true);
		expect(courseIds.includes(courseAsSubstitutionTeacher._id.toString())).to.equal(false);
	});

	it('may fetch only courses as student/teacher', async () => {
		const user = await testObjects.createTestUser();
		const courseAsStudent = await testObjects.createTestCourse({
			userIds: [user._id],
			untilDate: Date.now() + 600000,
		});
		const courseAsTeacher = await testObjects.createTestCourse({
			teacherIds: [user._id],
			untilDate: Date.now() + 600000,
		});
		const courseAsSubstitutionTeacher = await testObjects.createTestCourse({
			substitutionIds: [user._id],
			untilDate: Date.now() + 600000,
		});
		const response = await courseScopeListService.find({
			route: { scopeId: user._id },
			query: { substitution: 'false' },
		});
		expect(response).to.not.equal(undefined);
		expect(response.total).to.equal(2);
		expect(response.data).to.not.equal(undefined);
		const courseIds = response.data.map(course => course._id.toString());
		expect(courseIds.includes(courseAsStudent._id.toString())).to.equal(true);
		expect(courseIds.includes(courseAsTeacher._id.toString())).to.equal(true);
		expect(courseIds.includes(courseAsSubstitutionTeacher._id.toString())).to.equal(false);
	});

	it('may fetch only courses as substitution teacher', async () => {
		const user = await testObjects.createTestUser();
		const courseAsStudent = await testObjects.createTestCourse({
			userIds: [user._id],
			untilDate: Date.now() + 600000,
		});
		const courseAsTeacher = await testObjects.createTestCourse({
			teacherIds: [user._id],
			untilDate: Date.now() + 600000,
		});
		const courseAsSubstitutionTeacher = await testObjects.createTestCourse({
			substitutionIds: [user._id],
			untilDate: Date.now() + 600000,
		});
		const response = await courseScopeListService.find({
			route: { scopeId: user._id },
			query: { substitution: 'true' },
		});
		expect(response).to.not.equal(undefined);
		expect(response.total).to.equal(1);
		expect(response.data).to.not.equal(undefined);
		const courseIds = response.data.map(course => course._id.toString());
		expect(courseIds.includes(courseAsStudent._id.toString())).to.equal(false);
		expect(courseIds.includes(courseAsTeacher._id.toString())).to.equal(false);
		expect(courseIds.includes(courseAsSubstitutionTeacher._id.toString())).to.equal(true);
	});

	it('may fetch as both substitution teacher and student/teacher', async () => {
		const user = await testObjects.createTestUser();
		const courseAsStudent = await testObjects.createTestCourse({
			userIds: [user._id],
			untilDate: Date.now() + 600000,
		});
		const courseAsTeacher = await testObjects.createTestCourse({
			teacherIds: [user._id],
			untilDate: Date.now() + 600000,
		});
		const courseAsSubstitutionTeacher = await testObjects.createTestCourse({
			substitutionIds: [user._id],
			untilDate: Date.now() + 600000,
		});
		const response = await courseScopeListService.find({
			route: { scopeId: user._id },
			query: { substitution: 'all' },
		});
		expect(response).to.not.equal(undefined);
		expect(response.total).to.equal(3);
		expect(response.data).to.not.equal(undefined);
		const courseIds = response.data.map(course => course._id.toString());
		expect(courseIds.includes(courseAsStudent._id.toString())).to.equal(true);
		expect(courseIds.includes(courseAsTeacher._id.toString())).to.equal(true);
		expect(courseIds.includes(courseAsSubstitutionTeacher._id.toString())).to.equal(true);
	});

	it('passes on pagination', async () => {
		const user = await testObjects.createTestUser();
		const response = await courseScopeListService.find({
			route: { scopeId: user._id },
			query: { $limit: 23, $skip: 18 },
		});
		expect(response).to.not.equal(undefined);
		expect(response.limit).to.equal(23);
		expect(response.skip).to.equal(18);
	});

	it('allows disabling pagination', async () => {
		const user = await testObjects.createTestUser();
		const response = await courseScopeListService.find({
			route: { scopeId: user._id },
			query: {},
			paginate: false,
		});
		expect(response).to.not.equal(undefined);
		expect(Array.isArray(response)).to.equal(true);
	});

	after(async () => {
		await testObjects.cleanup();
	});
});

describe('courses scopelist service integration', () => {
	let server;

	before((done) => {
		server = app.listen(0, done);
	});

	after((done) => {
		server.close(done);
	});

	it('fails without authorization', async () => {
		try {
			const user = await testObjects.createTestUser();
			await courseScopeListService.find({
				route: { scopeId: user._id },
				query: {},
				provider: 'rest',
			});
			throw new Error('should have failed');
		} catch (err) {
			expect(err).to.not.equal(undefined);
			expect(err.name).to.equal('NotAuthenticated');
			expect(err.message).to.equal('No auth token');
		}
	});

	it('fails for other user', async () => {
		try {
			const user = await testObjects.createTestUser();
			const targetUser = await testObjects.createTestUser();
			const params = await generateRequestParamsFromUser(user);
			params.route = { scopeId: targetUser._id };
			params.query = {};
			await courseScopeListService.find(params);
			throw new Error('should have failed');
		} catch (err) {
			expect(err).to.not.equal(undefined);
			expect(err.name).to.equal('Forbidden');
			expect(err.message).to.equal('Requested and requesting userIds do not match.');
		}
	});

	it('works for student of a course');

	it('works for teacher');
});
