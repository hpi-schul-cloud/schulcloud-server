'use strict';

module.exports = function() {
	const app = this;

	app.use('/provider/users/:token/metadata', {
		find(params) {
			const pseudoService = app.service("pseudonym");
			return pseudoService.find({
				query: {
					token: params.token
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
						'firstname': "First",
						'lastname': "Name",
						'type': user.roles[0].name,
						'school_id': user.schoolId
					});
				});
			});
		}
	});

	app.use('/provider/users/:token/groups', {
		find(params) {
			console.log(params);
			const pseudoService = app.service("pseudonym");
			return pseudoService.find({
				query: {
					token: params.token
				}
			}).then(pseudonym => {
				console.log(pseudonym);
				if (!pseudonym.data[0]) {
					return Promise.reject("User not found by token");
				}
				const toolId = (pseudonym.data[0].toolId);
				const courseService = app.service("courses");
				return courseService.find({
					query: {
						ltiToolIds: toolId
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
	// app.use('/provider/:id/groups', groupService());
};
