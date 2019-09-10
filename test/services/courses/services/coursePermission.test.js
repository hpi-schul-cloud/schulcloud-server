const { expect } = require('chai');
const { Forbidden } = require('@feathersjs/errors');

const app = require('../../../../src/app');
const testObjects = require('../../helpers/testObjects')(app);

const coursePermissionService = app.service('/courses/:scopeId/userPermissions');

describe('PermissionService', async () => {
	const studentPermissions = [
		'COURSE_VIEW',
		'TOOL_VIEW',
		'NEWS_VIEW',
		'ROLE_VIEW',
		'USERGROUP_VIEW',
		'COURSEGROUP_CREATE',
		'COURSEGROUP_EDIT',
		'LESSONS_VIEW',
		'HOMEWORK_VIEW',
		'COMMENTS_VIEW',
		'COMMENTS_CREATE',
		'COMMENTS_EDIT',
		'SUBMISSIONS_VIEW',
		'SUBMISSIONS_CREATE',
		'SUBMISSIONS_EDIT',
		'FILESTORAGE_VIEW',
		'FILESTORAGE_EDIT',
		'FILESTORAGE_CREATE',
		'FILESTORAGE_REMOVE',
		'CONTENT_VIEW',
		'CONTENT_NON_OER_VIEW',
	];

	const teacherPermissions = [
		'COURSE_CREATE',
		'COURSE_EDIT',
		'COURSE_DELETE',
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
		...studentPermissions,
	];

	const substitutionTeacherPermissions = [
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
		...studentPermissions,
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
