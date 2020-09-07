const { ObjectId } = require('mongoose').Types;

const { connect, close } = require('../src/utils/database');
const Roles = require('../src/services/role/model');

module.exports = {
	up: async function up() {
		await connect();
		await Roles.create([
			{
				name: 'courseStudent',
				roles: [],
				permissions: [
					'COURSE_VIEW',
					'TOOL_VIEW',
					'NEWS_VIEW',
					'ROLE_VIEW',
					'USERGROUP_VIEW',
					'COURSEGROUP_CREATE',
					'COURSEGROUP_EDIT',
					'LESSONS_VIEW',
					'HOMEWORK_VIEW',
					'HOMEWORK_EDIT',
					'HOMEWORK_CREATE',
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
				],
			},
			{
				name: 'courseTeacher',
				roles: [new ObjectId('5bb5c62bfb457b1c3c0c7f00')],
				permissions: [
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
				],
			},
			{
				name: 'courseSubstitutionTeacher',
				roles: [new ObjectId('5bb5c62bfb457b1c3c0c7f00')],
				permissions: [
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
				],
			},
			{
				name: 'courseAdministrator',
				roles: [new ObjectId('5bb5c62bfb457b1c3c0c7f01')],
				permissions: [],
			},
		]);
		await close();
	},

	down: async function down() {
		await connect();
		await Roles.deleteMany({
			name: {
				$in: ['courseStudent', 'courseTeacher', 'courseSubstitutionTeacher', 'courseAdministrator'],
			},
		});
		await close();
	},
};
