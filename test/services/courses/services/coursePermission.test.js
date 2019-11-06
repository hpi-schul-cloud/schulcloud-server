const { expect } = require('chai');
const { Forbidden } = require('@feathersjs/errors');

const app = require('../../../../src/app');
const testObjects = require('../../helpers/testObjects')(app);

const coursePermissionService = app.service('/courses/:scopeId/userPermissions');

describe('PermissionService', async () => {
	const studentPermissions = [
		...new Set([
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
			'LESSONS_VIEW',
			'NEWS_VIEW',
			'ROLE_VIEW',
			'SUBMISSIONS_CREATE',
			'SUBMISSIONS_EDIT',
			'SUBMISSIONS_VIEW',
			'TOOL_VIEW',
			'USERGROUP_VIEW',
		]),
	];

	const teacherPermissions = [
		...new Set([
			'COURSE_CREATE',
			'COURSE_EDIT',
			'COURSE_DELETE',
			'HOMEWORK_CREATE',
			'HOMEWORK_EDIT',
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
			...studentPermissions,
		]),
	];

	const substitutionTeacherPermissions = [
		...new Set([
			'HOMEWORK_CREATE',
			'HOMEWORK_EDIT',
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
			...studentPermissions,
		]),
	];

	let course;
	const userIds = [];
	const teacherIds = [];
	const substitutionIds = [];
	const schoolId = '0000d186816abba584714c5f';

	before(async () => {
		const studentOne = await testObjects.createTestUser({
			firstName: 'Hans',
			lastName: 'Wurst',
			email: 'H.Wurst@spass.toll',
			roles: ['student'],
			schoolId,
		});
		userIds.push(studentOne._id.toString());

		const studentTwo = await testObjects.createTestUser({
			firstName: 'Karla',
			lastName: 'Hansen',
			email: 'karla-hansen@spass.toll',
			roles: ['student'],
			schoolId,
		});
		userIds.push(studentTwo._id.toString());

		const teacher = await testObjects.createTestUser({
			firstName: 'Dorote',
			lastName: 'Musterfrau',
			email: 'Dorote@spass.toll',
			roles: ['teacher'],
			schoolId,
		});
		teacherIds.push(teacher._id.toString());

		const substitution = await testObjects.createTestUser({
			firstName: 'Karl',
			lastName: 'Musterfrau',
			email: 'k.Musterfrau@spass.toll',
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

	after(() => {
		testObjects.cleanup();
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

		expect(permissions[userIds[1]]).to.have.members(studentPermissions);
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

		expect(permissions[teacherIds[0]]).to.have.members(teacherPermissions);
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

		expect(permissions[substitutionIds[0]]).to.have.members(substitutionTeacherPermissions);
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
});
