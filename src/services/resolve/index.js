'use strict';

const errors = require('feathers-errors');
const swaggerDocs = require('./docs/');
const swagger = require('feathers-swagger');

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

	constructor(){
		this.docs = swaggerDocs.resolveService.scopesService;
	}

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
					courseService.find({query: {$or: [{userIds: user._id}, {teacherIds: user._id}]}, headers: {"x-api-key": (params.headers || {})["x-api-key"]}}),
					classService.find({query: {$or: [{userIds: user._id}, {teacherIds: user._id}]}, headers: {"x-api-key": (params.headers || {})["x-api-key"]}})
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

						let isTeacher = scope.teacherIds.filter((teacherId) => {
							return JSON.stringify(teacherId) === JSON.stringify(user._id);
						});
						if(isTeacher.length > 0) {
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

	constructor(){
		this.docs = swaggerDocs.resolveService.usersService;
	}

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
		const getScope = Promise.all([
			userService.get(id, {headers: {"x-api-key": (params.headers || {})["x-api-key"]}}).then(data => {
				data.type = 'user';
				return data;
			}).catch(_ => undefined),
			courseService.get(id, {headers: {"x-api-key": (params.headers || {})["x-api-key"]}}).then(data => {
				return data;
			}).catch(_ => undefined),
			classService.get(id, {headers: {"x-api-key": (params.headers || {})["x-api-key"]}}).then(data => {
				return data;
			}).catch(_ => undefined)
		]).then(([userData, courseData, classData]) => {
			return userData || courseData || classData;
		});


		return getScope.then(scope => {
				// find users that are related to scope (either teacher or student)
			if(!scope) throw new errors.NotFound('No scope found for given id.');

					return userService.find({
						query: {
							$or: [
								{
									_id: {
										$in: scope.userIds
									}
								},
								{
									_id: {
										$in: scope.teacherIds
									}
								},
								{
									_id: scope._id
								}
							],
							$populate: ["roles"]
						}
					});
			})
			.then(data => {
				const users = data.data;

				response.data = users.map(user => {
					let authorities = ["can-read"];
					let isTeacher = user.roles.filter((role) => {
						return role.name === 'teacher';
					});
					if(isTeacher.length > 0) {
						authorities.push("can-write", "can-send-notifications");
					}

					return getDataEntry({
						type: 'user',
						id: user._id,
						name: user.fullName,
						authorities: authorities
					});
				});
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
