const { expect } = require('chai');
const app = require('../../../../src/app');
const testObjects = require('../../helpers/testObjects')(app);
const { generateRequestParamsFromUser } = require('../../helpers/services/login')(app);

const coursePermissionService = app.service('/courses/:scopeId/userPermissions');

describe('PermissionService', async () => {
	const studentPermissions = [
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

	let course;
	const userIds = [
		'58b40278dac20e0645353e3a',
		'0000d213816abba584714c0b',
	];
	const teacherIds = ['0000d231816abba584714c9e'];
	const substitutionIds = ['0000d224816abba584714c9c'];

	before(async () => {
		course = await testObjects.createTestCourse({
			name: 'Mathe 9b',
			schoolId: '0000d186816abba584714c5f',
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
		} catch (err) {
			expect(err).to.not.equal(undefined);
			expect(err.name).to.equal('Forbidden');
		}

	});
});
