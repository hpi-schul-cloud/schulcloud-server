'use strict';

// get an json api conform entry
const getDataEntry = ({type, id, name, authorities = ["can-read"], attributes = {}}) => {
	return {
		type,
		id,
		attributes: Object.assign({}, {
			name,
			authorities
		}, attributes)
	};
};

// get scopes from user object Id
class ScopeResolver {
	get(id, params) {
		const userService = this.app.service('/users');
		const courseService = this.app.service('/courses');
		const classService = this.app.service('/classes');

		const response = {
			links: {
				self: '',
				first: '',
				last: '',
				next: '',
				prev: ''
			},
			data: []
		};

		return userService.get(id)
			.then(user => {
				response.data.push(getDataEntry({
					type: 'user',
					id: user._id,
					name: user.fullName,
					authorities: [
						"can-read",
						"can-write",
						"can-send-notifications"
					]
				}));

				// find courses and classes where user is student or teacher
				return Promise.all([
					courseService.find({query: {$or: [{userIds: user._id}, {teacherIds: user._id}]}}),
					classService.find({query: {$or: [{userIds: user._id}, {teacherIds: user._id}]}})
				]).then(([courses, classes]) => {
					courses.data = courses.data.map(c => {
						c.attributes = {
							scopeType: 'course'
						};
						return c;
					});

					classes.data = classes.data.map(c => {
						c.attributes = {
							scopeType: 'class'
						};
						return c;
					});

					const scopes = [].concat(courses.data, classes.data);
					scopes.forEach(scope => {
						const authorities = ["can-read"];

						if(scope.teacherIds.includes(user._id)) {
							authorities.push("can-write", "can-send-notifications");
						}

						response.data.push(getDataEntry({
							type: 'scope',
							id: scope._id,
							name: scope.name,
							authorities,
							attributes: scope.attributes
						}));
					});

					return Promise.resolve(response);
				});
			});
	}

	setup(app, path) {
		this.app = app;
	}
}

// get users from UUID (e.g. course id)
class UserResolver {
	get(id, params) {
		// token should NOT be userId but for testing purpose it's easier right now
		const userService = this.app.service('/users');
		const courseService = this.app.service('/courses');
		const classService = this.app.service('/classes');

		const response = {
			links: {
				self: '',
				first: '',
				last: '',
				next: '',
				prev: ''
			},
			data: []
		};

		// only if both services fail the error will be thrown
		const getScope = new Promise((resolve, reject) => {
			let error;

			courseService.get(id).then(data => {
				return resolve(data);
			}).catch(err => {
				if(error) {
					reject(error);
				}
				error = err;
			});

			classService.get(id).then(data => {
				return resolve(data);
			}).catch(err => {
				if(error) {
					reject(error);
				}
				error = err;
			});
		});


		return getScope.then(scope => {
				// find users that are related to scope (either teacher or student)
				return userService.find({query: {
					$or: [
						{_id: {
							$in: scope.userIds
						}},
						{_id: {
							$in: scope.teacherIds
						}}
					]
				}});
			})
			.then(data => {
				const users = data.data;

				response.data = users.map(user =>
					getDataEntry({
						type: 'user',
						id: user._id,
						name: user.fullName,
						authorities: ["can-read"]
					})
				);
				return Promise.resolve(response);
		});
	}

	setup(app, path) {
		this.app = app;
	}
}

module.exports = function () {
	const app = this;

	// Initialize our service with any options it requires
	app.use('/resolve/scopes', new ScopeResolver());
	app.use('/resolve/users', new UserResolver());
};
