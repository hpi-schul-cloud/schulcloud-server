const { expect } = require('chai');
const { Forbidden } = require('@feathersjs/errors');

const app = require('../../../../src/app');
const testObjects = require('../../helpers/testObjects')(app);

const coursePermissionService = app.service('/courses/:scopeId/userPermissions');

describe('PermissionService', async () => {
	const userPermissions = [
		'BASE_VIEW',
		'DASHBOARD_VIEW',
		'TOOL_VIEW',
		'PASSWORD_EDIT',
		'FOLDER_DELETE',
		'FOLDER_CREATE',
		'FILE_DELETE',
		'FILE_CREATE',
		'FILE_MOVE',
		'ACCOUNT_EDIT',
		'CALENDAR_VIEW',
		'CALENDAR_EDIT',
		'CALENDAR_CREATE',
		'FEDERALSTATE_VIEW',
		'HELPDESK_CREATE',
		'TOPIC_VIEW',
		'LINK_CREATE',
		'NEWS_VIEW',
		'NOTIFICATION_VIEW',
		'NOTIFICATION_EDIT',
		'NOTIFICATION_CREATE',
		'PWRECOVERY_VIEW',
		'PWRECOVERY_EDIT',
		'PWRECOVERY_CREATE',
		'RELEASES_VIEW',
		'ROLE_VIEW',
		'USERGROUP_VIEW',
		'COURSEGROUP_CREATE',
		'COURSEGROUP_EDIT',
		'SYSTEM_VIEW',
		'USER_VIEW',
		'USER_EDIT',
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
		'CONTENT_VIEW',
		'CONTENT_NON_OER_VIEW',
		'FILESTORAGE_REMOVE',
		'TEAM_VIEW',
		'TEAM_EDIT',
		'TEAM_CREATE',
	];

	const studentPermissions = [...userPermissions];

	const teacherPermissions = [
		'ACCOUNT_CREATE',
		'COURSE_EDIT',
		'HOMEWORK_EDIT',
		'HOMEWORK_CREATE',
		'LESSONS_VIEW',
		'NEWS_CREATE',
		'NEWS_EDIT',
		'SCHOOL_NEWS_EDIT',
		'STUDENT_CREATE',
		'STUDENT_DELETE',
		'STUDENT_SKIP_REGISTRATION',
		'SUBMISSIONS_SCHOOL_VIEW',
		'TEACHER_CREATE',
		'TOOL_CREATE',
		'TOOL_EDIT',
		'TOOL_NEW_VIEW',
		'TOPIC_CREATE',
		'TOPIC_EDIT',
		'USER_CREATE',
		'USERGROUP_CREATE',
		'USERGROUP_EDIT',
		'TEAM_INVITE_EXTERNAL',
		...userPermissions,
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
			roles: ['0000d186816abba584714c99'],
			schoolId,
		});
		userIds.push(studentOne._id.toString());

		const studentTwo = await testObjects.createTestUser({
			firstName: 'Karla',
			lastName: 'Hansen',
			email: 'karla-hansen@spass.toll',
			roles: ['0000d186816abba584714c99'],
			schoolId,
		});
		userIds.push(studentTwo._id.toString());

		const teacher = await testObjects.createTestUser({
			firstName: 'Dorote',
			lastName: 'Musterfrau',
			email: 'Dorote@spass.toll',
			roles: ['0000d186816abba584714c98'],
			schoolId,
		});
		teacherIds.push(teacher._id.toString());

		const substitution = await testObjects.createTestUser({
			firstName: 'Karl',
			lastName: 'Musterfrau',
			email: 'k.Musterfrau@spass.toll',
			roles: ['0000d186816abba584714c98'],
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
	it('request as user', async () => {
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

		expect(permissions[substitutionIds[0]]).to.have.members(teacherPermissions);
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
