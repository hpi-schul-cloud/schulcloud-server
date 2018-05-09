'use strict';

const errors = require('feathers-errors');

module.exports = function() {
	const app = this;

	const tokenIsActive = context => {
		return context.app.service('/oauth2proxy/introspect')
			.create({token: context.params.headers.authorization.replace('Bearer ', '')})
			.then(introspection => {
				if(introspection.active) {
					context.params.tokenInfo = introspection
					return context
				}
				throw new errors.BadRequest('Access token invalid')
			}).catch(error => {
			throw new Error(error)
		})
	};

	const userIsMatching = context => {
		if (context.params.tokenInfo.sub === context.params.token) {
			return context
		} else {
			throw new errors.BadRequest('No permissions for the user')
		}
	}

	const injectOriginToolIds = context => {
		if (!context.params.tokenInfo) throw new Error('Token info is missing in params') // first call isTokenActive
		const toolService = context.app.service("ltiTools");
		return toolService.find({
			query: {
				oAuthClientId: context.params.tokenInfo.client_id
			}
		}).then(originTools => {
			return toolService.find({
				query: {
					originTool: originTools.data[0]._id
				}
			}).then(tools => {
				context.params.toolIds = [originTools.data[0]._id] // don't forget actual requested tool id
				context.params.toolIds = context.params.toolIds.concat(tools.data.map(tool => tool._id)) // all origin tool ids
				return context
			});
		});
	}

	const groupContainsUser = context => {
		if(!context.result.data) return context
		if (context.result.data.students
				.concat(context.result.data.teachers)
				.find(user => (user.user_id === context.params.tokenInfo.sub))) {
			return context
		}
		throw new errors.BadRequest("Current user is not part of group")
	}

	app.use('/provider', {
		find(params) {
			return Promise.resolve("Provider interface available");
		}
	})

	app.use('/provider/users/:token/metadata', {
		find(params) {
			return app.service("pseudonym").find({
				query: {
					token: params.token
				}
			}).then(pseudonym => {
				if (!pseudonym.data[0]) {
					return { errors: {"description": "User not found by token"}};
				}
				const userId = (pseudonym.data[0].userId);
				return app.service("users").find({
					query: {
						_id: userId,
						$populate: ['roles']
					}
				}).then(users => {
					const user = users.data[0];
					return {
						data: {
							'user_id': params.token,
							'username': "Anonym",
							'type': user.roles[0].name
						}

					};
				});
			});
		}
	});

	app.service('/provider/users/:token/metadata').before({
		find: [tokenIsActive, userIsMatching]
	})

	app.use('/provider/users/:token/groups', {
		find(params) {
			return app.service("pseudonym").find({
				query: {
					token: params.token
				}
			}).then(pseudonym => {
				if (!pseudonym.data[0]) {
					return Promise.reject("User not found by token");
				}

				const userId = (pseudonym.data[0].userId);
				return app.service("courses").find({
					query: {
						ltiToolIds: { $in: params.toolIds },
						$or: [
							{userIds: userId},
							{teacherIds: userId}
						]
					}
				}).then(courses => ({
					data: {
						groups: courses.data.map(course => ({
							group_id: course._id,
							name: course.name,
							student_count: course.userIds.length
						}))
					}
				}));
			});
		}
	});

	app.service('/provider/users/:token/groups').before({
		find: [tokenIsActive, userIsMatching, injectOriginToolIds]
	})

	app.use('/provider/groups', {
		get(id, params) {
			const courseService = app.service("courses");
			return courseService.find({
				query: {
					_id: id,
					ltiToolIds: { $in: params.toolIds }
				}
			}).then(courses => {
				if (!courses.data[0]) {
					return { errors: {"description": "Group not found"}};
				}
				const course = courses.data[0];
				const pseudoService = app.service("pseudonym");

				return Promise.all([
					pseudoService.find({
						query: {
							userId: course.userIds,
							toolId: params.toolIds[0]
						}
					}),
					pseudoService.find({
						query: {
							userId: course.teacherIds,
							toolId: params.toolIds[0]
						}
					}),
				]).then(([users, teachers]) => ({
					data: {
						students: users.data.map(user => ({
							"user_id": user.token
						})),
						teachers: teachers.data.map(user => ({
							"user_id": user.token
						}))
					}
				}));
			});
		}
	});

	app.service('/provider/groups').before({
		get: [tokenIsActive, injectOriginToolIds]
	})

	app.service('/provider/groups').after({
		get: groupContainsUser
	})
};
