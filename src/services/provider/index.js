'use strict';

module.exports = function() {
	const app = this;

	// TODO: check permissions for tool and user combination

	app.use('/provider', {
		find(params) {
			return Promise.resolve([]);
		}
	})

	app.use('/provider/:toolId/users/:token/metadata', {
		find(params) {
			const pseudoService = app.service("pseudonym");
			return pseudoService.find({
				query: {
					token: params.token,
					toolId: params.toolId
				}
			}).then(pseudonym => {
				console.log(pseudonym);
				if (!pseudonym.data[0]) {
					return Promise.reject("User not found by token");
				}
				const userId = (pseudonym.data[0].userId);
				const userService = app.service("users");
				return userService.find({
					query: {
						_id: userId,
						$populate: ['roles']
					}
				}).then(users => {
					console.log(users.data[0]);
					const user = users.data[0];
					return Promise.resolve({
						'user_id': params.token,
						'username': "foo",
						'type': user.roles[0].name,
						'school_id': user.schoolId
					});
				});
			});
		}
	});

	app.use('/provider/:toolId/users/:token/groups', {
		find(params) {
			console.log(params);
			const pseudoService = app.service("pseudonym");
			return pseudoService.find({
				query: {
					token: params.token,
					toolId: params.toolId
				}
			}).then(pseudonym => {
				console.log(pseudonym);
				if (!pseudonym.data[0]) {
					return Promise.reject("User not found by token");
				}
				const userId = (pseudonym.data[0].userId);
				const courseService = app.service("courses");
				return courseService.find({
					query: {
						ltiToolIds: params.toolId,
						$or: [
							{userIds: userId},
							{teacherIds: userId}
						]
					}
				}).then(courses => {
					console.log();
					return Promise.resolve(courses.data.map(course => ({
						id: course._id,
						name: course.name,
						studentCount: course.userIds.length
					})));
				});
			});
		}
	});

	app.use('/provider/:toolId/groups', {
		get(id, params) {
			const courseService = app.service("courses");
			return courseService.find({
				query: {
					_id: id,
					ltiToolIds: params.toolId
				}
			}).then(courses => {
				if (!courses.data[0]) {
					return Promise.reject("Group not found");
				}
				const course = courses.data[0];

				const pseudoService = app.service("pseudonym");

				return Promise.all([
					pseudoService.find({
						query: {
							userId: course.userIds,
							toolId: params.toolId
						}
					}),
					pseudoService.find({
						query: {
							userId: course.teacherIds,
							toolId: params.toolId
						}
					}),
				]).then(([users, teachers]) => {
					return Promise.resolve({
						students: users.data.map(user => ({
							"user_id": user.token
						})),
						teachers: teachers.data.map(user => ({
							"user_id": user.token
						}))
					});
				});
			});
		}
	});
};
