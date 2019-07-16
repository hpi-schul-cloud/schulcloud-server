const { expect } = require('chai');
const app = require('../../../../src/app');
const testObjects = require('../../helpers/testObjects')(app);
const { generateRequestParamsFromUser } = require('../../helpers/services/login')(app);

const courseScopeListService = app.service('/users/:scopeId/courses');

describe.only('courses scopelist service', () => {
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

	it('may fetch only courses as student');

	it('may fetch only courses as teacher');

	it('may fetch only courses as substitution teacher');

	it('may fetch count of active courses');

	it('may fetch count of archived courses');

	it('may fetch count of all courses');

	after(async () => {
		await testObjects.cleanup();
	});
});

describe.only('courses scopelist service integration', () => {
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

	it('fails for other user'/* , async () => {
		try {
			const targetUser = await testObjects.createTestUser();
			const caller = await testObjects.createTestUser();
			const requestParams = generateRequestParamsFromUser(caller);
			requestParams.query = {};
			requestParams.route = { scopeId: targetUser._id };
			await courseScopeListService.find(requestParams);
			throw new Error('should have failed');
		} catch (err) {
			console.log(err);
			expect(err).to.not.equal(undefined);
			expect(err.name).to.equal('NotAuthenticated');
			expect(err.message).to.equal('No auth token');
		}
	} */);

	it('works for student of a course');

	it('works for teacher');
});
