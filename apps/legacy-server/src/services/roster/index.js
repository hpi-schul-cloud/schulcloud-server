const { static: staticContent } = require('@feathersjs/express');
const path = require('path');

const hooks = require('./hooks');
const globalHooks = require('../../hooks');
const oauth2 = require('../oauth2/hooks');
const { excludeAttributesFromSanitization } = require('../../hooks/sanitizationExceptions');
const { isValid: isValidObjectId } = require('../../helper/compare').ObjectId;
const { ApplicationError } = require('../../errors');

module.exports = function roster() {
	const app = this;

	app.use('/roster/api', staticContent(path.join(__dirname, '/docs/openapi.yaml')));

	app.use('/roster', {
		find() {
			return Promise.resolve('Roster interface available');
		},
	});

	/**
	 * Takes a pseudonym from params and resolves with depseudonymization iframe content.
	 * @param {string} params.route.user pseudonym from the given user
	 * @param params.pseudonym
	 * @returns data.user_id pseudonym
	 * @returns data.type first given user role name
	 * @returns data.username depseudonymization iframe html-code
	 */
	const metadataHandler = {
		async find(params) {
			const { pseudonym } = params;
			const userParam = params.route.user;

			const pseudonyms = await app.service('pseudonym').find({
				query: {
					pseudonym,
				},
			});

			if (!pseudonyms || !pseudonyms.data || pseudonyms.data.length !== 1) {
				return { errors: { description: 'User not found by token' } };
			}
			const { userId } = pseudonyms.data[0];
			const users = await app.service('users').find({
				query: {
					_id: userId,
					$populate: ['roles'],
				},
			});

			const user = users.data[0];
			return {
				data: {
					user_id: userParam,
					username: oauth2.getSubject(pseudonym, app.settings.services.web),
					type: user.roles.map((role) => role.name).some((roleName) => roleName === 'teacher') ? 'teacher' : 'student',
				},
			};
		},
	};

	const metadataHooks = {
		before: {
			find: [
				globalHooks.ifNotLocal(hooks.tokenIsActive),
				globalHooks.ifNotLocal(hooks.userIsMatching),
				hooks.stripIframe,
				excludeAttributesFromSanitization('roster/users/:user/metadata', 'username'),
			],
		},
	};

	const metaRoute = '/roster/users/:user/metadata';
	app.use(metaRoute, metadataHandler);
	app.service(metaRoute).hooks(metadataHooks);

	/**
	 * Takes a pseudonym and toolIds from params and resolves with courses the user is part of
	 * and which are using the tools specified by the toolIds
	 * @param {string} params.pseudonym The pseudonym of the given user
	 * @param params.toolIds Ids of the given tools
	 * @returns Array of course data including the group id, the group name, and the number of students
	 */
	const userGroupsHandler = {
		async find(params) {
			const pseudonyms = await app.service('pseudonym').find({
				query: {
					pseudonym: params.pseudonym,
				},
			});

			if (!pseudonyms || !pseudonyms.data || pseudonyms.data.length !== 1) {
				return { errors: { description: 'User not found by token' } };
			}
			const pseudonym = pseudonyms.data[0];
			const { userId } = pseudonym;

			const userCourses = await app.service('courses').find({
				query: {
					$or: [{ userIds: userId }, { teacherIds: userId }, { substitutionIds: userId }],
					$populate: ['ltiToolIds'],
				},
			});

			const courses = userCourses.data.filter((course) => {
				course.ltiToolIds = course.ltiToolIds || [];
				const originalToolIds = course.ltiToolIds.map((toolId) => (toolId.originTool || '').toString());
				return originalToolIds.includes(params.originToolId.toString());
			});

			// all users courses with given tool enabled
			return {
				data: {
					groups: courses.map((course) => ({
						group_id: course._id.toString(),
						name: course.name,
						student_count: course.userIds.length,
					})),
				},
			};
		},
	};

	const userGroupsHooks = {
		before: {
			find: [
				globalHooks.ifNotLocal(hooks.tokenIsActive),
				globalHooks.ifNotLocal(hooks.userIsMatching),
				hooks.stripIframe,
				hooks.injectOriginToolId,
			],
		},
	};
	const userGroupRoute = '/roster/users/:user/groups';
	app.use(userGroupRoute, userGroupsHandler);
	app.service(userGroupRoute).hooks(userGroupsHooks);

	/**
	 * Takes a course id and returns the pseudonyms of the group members
	 * @param id ID of the given course
	 * @returns {Array} data.students student ids and pseudonyms of students which are enrolled in the course
	 * @returns {Array} data.teacers teacher ids and pseudonyms of teachers which are enrolled in the course
	 */
	const groupsHandler = {
		async get(id, params) {
			const courseService = app.service('courses');
			const courseId = id;
			if (!isValidObjectId(courseId)) {
				throw new ApplicationError('invalid courseId', { courseId });
			}

			const { originToolId } = params;

			const courses = await courseService.find({
				query: {
					_id: courseId,
					$populate: ['ltiToolIds'],
				},
			});

			if (!courses.data[0]) {
				return { errors: { description: 'Group not found' } };
			}
			const course = courses.data[0];
			if (!course.ltiToolIds.map((toolId) => toolId.originTool.toString()).includes(originToolId.toString())) {
				return { errors: { description: 'Group does not contain the tool' } };
			}
			const pseudonymService = app.service('pseudonym');
			const [users, teachers] = await Promise.all([
				pseudonymService.find({
					query: {
						userId: course.userIds,
						toolId: originToolId,
					},
				}),
				pseudonymService.find({
					query: {
						userId: course.teacherIds.concat(course.substitutionIds || []),
						toolId: originToolId,
					},
				}),
			]);

			return {
				data: {
					students: users.data.map((user) => ({
						user_id: user.pseudonym,
						username: oauth2.getSubject(user.pseudonym, app.settings.services.web),
					})),
					teachers: teachers.data.map((user) => ({
						user_id: user.pseudonym,
						username: oauth2.getSubject(user.pseudonym, app.settings.services.web),
					})),
				},
			};
		},
	};
	const groupsHooks = {
		before: {
			get: [
				globalHooks.ifNotLocal(hooks.tokenIsActive),
				hooks.injectOriginToolId,
				excludeAttributesFromSanitization('roster/groups', 'username'),
			],
		},
		after: {
			get: hooks.groupContainsUser,
		},
	};

	app.use('/roster/groups', groupsHandler);
	app.service('/roster/groups').hooks(groupsHooks);
};
