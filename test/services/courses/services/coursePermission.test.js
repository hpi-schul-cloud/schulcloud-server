const { expect } = require('chai');
const reqlib = require('app-root-path').require;

const { Forbidden } = reqlib('src/errors');

const appPromise = require('../../../../src/app');
const testObjects = require('../../helpers/testObjects')(appPromise);

describe('CoursePermissionService', () => {
	let app;
	let coursePermissionService;

	const studentPermissions = [
		...new Set(
			[
				'COMMENTS_CREATE',
				'COMMENTS_EDIT',
				'COMMENTS_VIEW',
				'CONTENT_NON_OER_VIEW',
				'CONTENT_VIEW',
				'COURSE_VIEW',
				'COURSEGROUP_CREATE',
				'COURSEGROUP_EDIT',
				'FILESTORAGE_CREATE',
				'FILESTORAGE_EDIT',
				'FILESTORAGE_REMOVE',
				'FILESTORAGE_VIEW',
				'HOMEWORK_CREATE',
				'HOMEWORK_EDIT',
				'HOMEWORK_VIEW',
				'JOIN_MEETING',
				'LESSONS_VIEW',
				'NEWS_VIEW',
				'ROLE_VIEW',
				'SUBMISSIONS_CREATE',
				'SUBMISSIONS_EDIT',
				'SUBMISSIONS_VIEW',
				'TOOL_VIEW',
				'USERGROUP_VIEW',
			].sort()
		),
	];

	const teacherPermissions = [
		...new Set(
			[
				'COURSE_CREATE',
				'COURSE_EDIT',
				'COURSE_DELETE',
				'HOMEWORK_CREATE',
				'HOMEWORK_EDIT',
				'JOIN_MEETING',
				'LESSONS_VIEW',
				'LESSONS_CREATE',
				'NEWS_CREATE',
				'NEWS_EDIT',
				'TOOL_CREATE',
				'TOOL_EDIT',
				'TOOL_NEW_VIEW',
				'TOPIC_CREATE',
				'TOPIC_EDIT',
				'USER_CREATE',
				'USERGROUP_CREATE',
				'USERGROUP_EDIT',
				'SCOPE_PERMISSIONS_VIEW',
				'START_MEETING',
				...studentPermissions,
			].sort()
		),
	];

	const substitutionTeacherPermissions = [
		...new Set(
			[
				'HOMEWORK_CREATE',
				'HOMEWORK_EDIT',
				'JOIN_MEETING',
				'LESSONS_CREATE',
				'NEWS_CREATE',
				'NEWS_EDIT',
				'TOOL_CREATE',
				'TOOL_EDIT',
				'TOOL_NEW_VIEW',
				'TOPIC_CREATE',
				'TOPIC_EDIT',
				'USER_CREATE',
				'USERGROUP_CREATE',
				'USERGROUP_EDIT',
				'SCOPE_PERMISSIONS_VIEW',
				'START_MEETING',
				...studentPermissions,
			].sort()
		),
	];

	let course;
	const userIds = [];
	const teacherIds = [];
	const substitutionIds = [];
	const schoolId = '599ec14d8e4e364ec18ff46c';

	let server;

	before(async () => {
		app = await appPromise;
		coursePermissionService = app.service('/courses/:scopeId/userPermissions');
		server = await app.listen(0);
		const studentOne = await testObjects.createTestUser({
			firstName: 'Hans',
			lastName: 'Wurst',
			email: `${Date.now()}H.Wurst@spass.toll`,
			roles: ['student'],
			schoolId,
		});
		userIds.push(studentOne._id.toString());

		const studentTwo = await testObjects.createTestUser({
			firstName: 'Karla',
			lastName: 'Hansen',
			email: `${Date.now()}karla-hansen@spass.toll`,
			roles: ['student'],
			schoolId,
		});
		userIds.push(studentTwo._id.toString());

		const teacher = await testObjects.createTestUser({
			firstName: 'Dorote',
			lastName: 'Musterfrau',
			email: `${Date.now()}Dorote@spass.toll`,
			roles: ['teacher'],
			schoolId,
		});
		teacherIds.push(teacher._id.toString());

		const substitution = await testObjects.createTestUser({
			firstName: 'Karl',
			lastName: 'Musterfrau',
			email: `${Date.now()}k.Musterfrau@spass.toll`,
			roles: ['teacher'],
			schoolId,
		});
		substitutionIds.push(substitution._id);

		course = await testObjects.createTestCourse({
			name: 'Mathe 9b',
			schoolId,
			userIds,
			teacherIds,
			substitutionIds,
			startDate: new Date('2018-12-17'),
		});
	});

	after(async () => {
		await testObjects.cleanup;
		await server.close();
	});

	it('registered the service', () => {
		expect(coursePermissionService).to.not.equal(undefined);
	});

	it('request as student', async () => {
		const permissions = await coursePermissionService.find({
			route: {
				scopeId: course._id,
			},

			query: {
				userId: userIds[1],
			},
		});
		const currentUserPermissions = permissions[userIds[1]].sort();
		expect(currentUserPermissions).to.have.members(studentPermissions);
	});

	it('request as teacher', async () => {
		const permissions = await coursePermissionService.find({
			route: {
				scopeId: course._id,
			},

			query: {
				userId: teacherIds[0],
			},
		});
		const currentTeacherPermissions = permissions[teacherIds[0]].sort();
		expect(currentTeacherPermissions).to.have.members(teacherPermissions);
	});

	it('request as substitution teacher', async () => {
		const permissions = await coursePermissionService.find({
			route: {
				scopeId: course._id,
			},

			query: {
				userId: substitutionIds[0],
			},
		});
		const currentSubstitutionTeacherPermissions = permissions[substitutionIds[0]].sort();
		expect(currentSubstitutionTeacherPermissions).to.have.members(substitutionTeacherPermissions);
	});

	it('request as not part of the course', async () => {
		try {
			await coursePermissionService.find({
				route: {
					scopeId: course._id,
				},

				query: {
					userId: '599ec14d8e4e364ec18ff46d',
				},
			});
			expect.fail('The previous call should have failed');
		} catch (err) {
			expect(err).to.be.instanceOf(Forbidden);
		}
	});

	it('rejects actions by users from other schools', async () => {
		const otherAdmin = await testObjects.createTestUser({ schoolId: '599ec14d8e4e364ec18ff46e' });
		try {
			await coursePermissionService.find({
				route: {
					scopeId: course._id,
				},

				query: {
					userId: otherAdmin._id.toString(),
				},
			});
			expect.fail('The previous call should have failed');
		} catch (err) {
			expect(err).to.be.instanceOf(Forbidden);
		}
	});
});
