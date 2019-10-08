const { expect } = require('chai');
const { Forbidden } = require('@feathersjs/errors');

const app = require('../../../../src/app');
const testObjects = require('../../helpers/testObjects')(app);

const coursePermissionService = app.service('/courses/:scopeId/userPermissions');

describe('PermissionService', async () => {
	const userPermissions = [
		'ACCOUNT_EDIT',
		'BASE_VIEW',
		'CALENDAR_CREATE',
		'CALENDAR_EDIT',
		'CALENDAR_VIEW',
		'COMMENTS_CREATE',
		'COMMENTS_EDIT',
		'COMMENTS_VIEW',
		'CONTENT_NON_OER_VIEW',
		'CONTENT_VIEW',
		'COURSEGROUP_CREATE',
		'COURSEGROUP_EDIT',
		'DASHBOARD_VIEW',
		'FEDERALSTATE_VIEW',
		'FILE_CREATE',
		'FILE_DELETE',
		'FILE_MOVE',
		'FILESTORAGE_CREATE',
		'FILESTORAGE_EDIT',
		'FILESTORAGE_REMOVE',
		'FILESTORAGE_VIEW',
		'FOLDER_CREATE',
		'FOLDER_DELETE',
		'HELPDESK_CREATE',
		'HOMEWORK_CREATE',
		'HOMEWORK_EDIT',
		'HOMEWORK_VIEW',
		'LINK_CREATE',
		'NEWS_VIEW',
		'NOTIFICATION_CREATE',
		'NOTIFICATION_EDIT',
		'NOTIFICATION_VIEW',
		'PASSWORD_EDIT',
		'PWRECOVERY_CREATE',
		'PWRECOVERY_EDIT',
		'PWRECOVERY_VIEW',
		'RELEASES_VIEW',
		'ROLE_VIEW',
		'SUBMISSIONS_CREATE',
		'SUBMISSIONS_EDIT',
		'SUBMISSIONS_VIEW',
		'SYSTEM_VIEW',
		'TEAM_CREATE',
		'TEAM_EDIT',
		'TEAM_VIEW',
		'TOOL_VIEW',
		'TOPIC_VIEW',
		'USERGROUP_VIEW',
	];

	const studentPermissions = [...userPermissions];

	const teacherPermissions = [
		'ACCOUNT_CREATE',
		'COURSE_EDIT',
		'LESSONS_VIEW',
		'NEWS_CREATE',
		'NEWS_EDIT',
		'SCHOOL_NEWS_EDIT',
		'STUDENT_CREATE',
		'STUDENT_DELETE',
		'STUDENT_EDIT',
		'STUDENT_LIST',
		'STUDENT_SKIP_REGISTRATION',
		'SUBMISSIONS_SCHOOL_VIEW',
		'TEACHER_CREATE',
		'TEACHER_LIST',
		'TEAM_INVITE_EXTERNAL',
		'TOOL_CREATE',
		'TOOL_EDIT',
		'TOOL_NEW_VIEW',
		'TOPIC_CREATE',
		'TOPIC_EDIT',
		'USERGROUP_CREATE',
		'USERGROUP_EDIT',
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
