'use strict';
const errors = require('feathers-errors');
const mongoose = require('mongoose');
const logger = require('winston');
const _ = require('lodash');
const KeysModel = require('../services/keys/model');
// Add any common hooks you want to share across services in here.

// don't require authentication for internal requests
exports.ifNotLocal = function (hookForRemoteRequests) {
	return function (hook) {
		if (typeof (hook.params.provider) != 'undefined') {	// meaning it's not a local call
			// Call the specified hook
			return hookForRemoteRequests.call(this, hook);
		}
	};
};

exports.forceHookResolve = (forcedHook) => {
	return (hook) => {
		forcedHook(hook)
		.then(() => {
			return Promise.resolve(hook);
		})
		.catch(() => {
			return Promise.resolve(hook);
		});
	};
};

exports.isAdmin = function (options) {
	return hook => {
		if (!(hook.params.user.permissions || []).includes('ADMIN')) {
			throw new errors.Forbidden('you are not an administrator');
		}

		return Promise.resolve(hook);
	};
};

exports.isSuperHero = function (options) {
	return hook => {
		const userService = hook.app.service('/users/');
		return userService.find({ query: { _id: (hook.params.account.userId || ""), $populate: 'roles' } })
			.then(user => {
				user.data[0].roles = Array.from(user.data[0].roles);
				if (!(user.data[0].roles.filter(u => (u.name === 'superhero')).length > 0)) {
					throw new errors.Forbidden('you are not a superhero, sorry...');
				}
				return Promise.resolve(hook);
			});
	};
};

exports.hasRole = function (hook, userId, roleName) {
	const userService = hook.app.service('/users/');

	return userService.get((userId || ''), { query: { $populate: 'roles'}})
		.then(user => {
			user.roles = Array.from(user.roles);

			return (_.some(user.roles, u => u.name == roleName));
			});
};

exports.hasPermission = function (permissionName) {
	return hook => {
		// If it was an internal call then skip this hook
		if (!hook.params.provider) {
			return hook;
		}

		// If an api key was provided, skip
		if ((hook.params.headers || {})["x-api-key"]) {
			return KeysModel.findOne({ key: hook.params.headers["x-api-key"] })
				.then(res => {
					if (!res)
						throw new errors.NotAuthenticated('API Key is invalid');
					return Promise.resolve(hook);
				})
				.catch(err => {
					throw new errors.NotAuthenticated('API Key is invalid.');
				});
		}
		// If test then skip too
		if (process.env.NODE_ENV === 'test')
			return Promise.resolve(hook);

		// Otherwise check for user permissions
		const service = hook.app.service('/users/');
		return service.get({ _id: (hook.params.account.userId || "") })
			.then(user => {
				user.permissions = Array.from(user.permissions);

				if (!(user.permissions || []).includes(permissionName)) {
					throw new errors.Forbidden(`You don't have the permission ${permissionName}.`);
				}
				return Promise.resolve(hook);
			});
	};
};

exports.removeResponse = function (excludeOptions) {
	/*
	excludeOptions = false => allways remove response
	excludeOptions = undefined => remove response when not GET or FIND request
	excludeOptions = ['get', ...] => remove when method not in array
	*/
	return (hook) => {
		// If it was an internal call then skip this hook
		if (!hook.params.provider) {
			return hook;
		}

		if(excludeOptions === undefined){
			excludeOptions = ['get', 'find'];
		}
		if(Array.isArray(excludeOptions) && excludeOptions.includes(hook.method)){
			return Promise.resolve(hook);
		}
		hook.result = {status: 200};
		return Promise.resolve(hook);
	};
};

// non hook releated function
exports.hasPermissionNoHook = function (hook, userId, permissionName) {
	const service = hook.app.service('/users/');
	return service.get({ _id: (userId || "") })
		.then(user => {
			user.permissions = Array.from(user.permissions);
			return (user.permissions || []).includes(permissionName);
		});
};

exports.hasRoleNoHook = function (hook, userId, roleName, account = false) {
	const userService = hook.app.service('/users/');
	const accountService = hook.app.service('/accounts/');
	if (account) {
		return accountService.get(userId)
			.then(account => {
				return userService.find({ query: { _id: (account.userId || ""), $populate: 'roles' } })
					.then(user => {
						user.data[0].roles = Array.from(user.data[0].roles);

						return (user.data[0].roles.filter(u => (u.name === roleName)).length > 0);
					});
			});
	} else {
		return userService.find({ query: { _id: (userId || ""), $populate: 'roles' } })
			.then(user => {
				user.data[0].roles = Array.from(user.data[0].roles);

				return (user.data[0].roles.filter(u => (u.name === roleName)).length > 0);
			});
	}
};

// resolves IDs of objects from serviceName specified by *key* instead of their *_id*
exports.resolveToIds = (serviceName, path, key, hook) => {
	// get ids from a probably really deep nested path
	const service = hook.app.service(serviceName);

	let values = deepValue(hook, path) || [];
	if (typeof values == 'string') values = [values];

	if (!values.length) return;

	let resolved = values.map(value => {
		if (!mongoose.Types.ObjectId.isValid(value)) {
			return _resolveToId(service, key, value);
		} else {
			return Promise.resolve(value);
		}
	});

	return Promise.all(resolved)
		.then(values => {
			deepValue(hook, path, values);
		});
};

exports.permitGroupOperation = (hook) => {
	if (!hook.id) {
		throw new errors.Forbidden('Operation on this service requires an id!');
	}
	return Promise.resolve(hook);
};


const _resolveToId = (service, key, value) => {
	let query = {};
	query[key] = value;
	return service.find({ query })
		.then(results => {
			const result = results.data[0];
			if (!result) throw new TypeError(`No records found where ${key} is ${value}.`);
			return result._id;
		});
};


const deepValue = (obj, path, newValue) => {
	path = path.split('.');
	const len = path.length - 1;

	let i;
	for (i = 0; i < len; i++) {
		obj = obj[path[i]];
	}

	if (newValue) obj[path[i]] = newValue;
	return obj[path[i]];
};

exports.computeProperty = function (Model, functionName, variableName) {
	return (hook) => {
		return Model.findById(hook.result._id)	// get the model instance to call functions etc  TODO make query results not lean
			.then(modelInstance => modelInstance[functionName]())	// compute that property
			.then(result => {
				hook.result[variableName] = Array.from(result);		// save it in the resulting object
			})
			.catch(e => logger.error(e))
			.then(_ => Promise.resolve(hook));

	};
};

exports.mapPaginationQuery = (hook) => {
	if ((hook.params.query || {}).$limit === '-1') {
		hook.params.paginate = false;
		delete hook.params.query.$limit;
		return Promise.resolve(hook);
	}
};

exports.checkCorrectCourseOrTeamId = async (hook) => {

	if (hook.data.teamId) {
		let teamService = hook.app.service('teams');

		let query = {
			userIds: {
				$elemMatch: { userId: hook.params.account.userId }
			}
		};

		let teams = await teamService.find({ query });

		if (teams.data.some(team => team._id.toString() === hook.data.teamId )) {
			return hook;
		} else {
			throw new errors.Forbidden("The entered team doesn't belong to you!");
		}
	} else if (hook.data.courseGroupId || hook.data.courseId) {
		let courseService = hook.app.service('courses');
		const courseId = (hook.data.courseId || '').toString() || (hook.id || '').toString();
		let query = { teacherIds: {$in: [hook.params.account.userId] } };

		if (hook.data.courseGroupId) {
			delete hook.data.courseId;
			query = {$or: [{teacherIds: {$in: [hook.params.account.userId]}}, {userIds: {$in: [hook.params.account.userId]}}]};
		}

		let courses = await courseService.find({ query });

		if (courses.data.some(course => course._id.toString() === courseId )) {
			return hook;
		} else {
			throw new errors.Forbidden("The entered course doesn't belong to you!");
		}
	} else {
		return hook;
	}
};

exports.injectUserId = (hook) => {
	if (typeof (hook.params.provider) == 'undefined') {
		if (hook.data.userId) {
			hook.params.account = {userId: hook.data.userId};
			hook.params.payload = {userId: hook.data.userId};
			delete hook.data.userId;
		}
	}

	return hook;
};

exports.restrictToCurrentSchool = hook => {
	let userService = hook.app.service("users");
		return userService.find({
			query: {
				_id: hook.params.account.userId,
				$populate: 'roles'
			}
		}).then(res => {
			let access = false;
			res.data[0].roles.map(role => {
				if (role.name === 'superhero')
					access = true;
			});
			if (access)
				return hook;
			if (hook.method == "get" || hook.method == "find") {
				if (hook.params.query.schoolId == undefined) {
					hook.params.query.schoolId = res.data[0].schoolId;
				} else if (hook.params.query.schoolId != res.data[0].schoolId) {
					throw new errors.Forbidden('You do not have valid permissions to access this.');
				}
			} else {
				if (hook.data.schoolId == undefined) {
					hook.data.schoolId = res.data[0].schoolId.toString();
				} else if (hook.data.schoolId != res.data[0].schoolId) {
					throw new errors.Forbidden('You do not have valid permissions to access this.');
				}
			}

			return hook;
	});
};

exports.restrictToUsersOwnCourses = hook => {
	let userService = hook.app.service('users');
	return userService.find({
		query: {
			_id: hook.params.account.userId,
			$populate: 'roles'
		}
	}).then(res => {
		let access = false;
		res.data[0].roles.map(role => {
			if (role.name === 'administrator' || role.name === 'superhero' )
				access = true;
		});
		if (access)
			return hook;

		if (hook.method === "get") {
			let courseService = hook.app.service('courses');
			return courseService.get(hook.id).then(course => {
				if (!(_.some(course.userIds, u => JSON.stringify(u) === JSON.stringify(hook.params.account.userId))) &&
					!(_.some(course.teacherIds, u => JSON.stringify(u) === JSON.stringify(hook.params.account.userId))) &&
					!(_.some(course.substitutionIds, u => JSON.stringify(u) === JSON.stringify(hook.params.account.userId)))) {
					throw new errors.Forbidden('You are not in that course.');
				}
			});
		} else if (hook.method === "find") {
			if (typeof(hook.params.query.$or) === 'undefined') {
				hook.params.query.$or = [
					{ userIds: res.data[0]._id },
					{ teacherIds: res.data[0]._id },
					{ substitutionIds: res.data[0]._id }
				];
			}
		}
		return hook;
	});
};

exports.restrictToUsersOwnClasses = hook => {
	let userService = hook.app.service('users');
	return userService.find({
		query: {
			_id: hook.params.account.userId,
			$populate: 'roles'
		}
	}).then(res => {
		let access = false;
		res.data[0].roles.map(role => {
			if (['administrator', 'superhero'].includes(role.name))
				access = true;
		});
		if (access)
			return hook;

		if (hook.method === "get") {
			let classService = hook.app.service('classes');
			return classService.get(hook.id).then(result => {
				if (!(_.some(result.userIds, u => JSON.stringify(u) === JSON.stringify(hook.params.account.userId))) &&
					!(_.some(result.teacherIds, u => JSON.stringify(u) === JSON.stringify(hook.params.account.userId)))) {
					throw new errors.Forbidden('You are not in that class.');
				}
			});
		} else if (hook.method === "find") {
			if (typeof(hook.params.query.$or) === 'undefined') {
				hook.params.query.$or = [
					{ userIds: res.data[0]._id },
					{ teacherIds: res.data[0]._id },
					{ substitutionIds: res.data[0]._id }
				];
			}
		}
		return hook;
	});
};

// meant to be used as an after hook
exports.denyIfNotCurrentSchool = ({ errorMessage = 'Die angefragte Ressource gehört nicht zur eigenen Schule!' }) =>
	hook => {
		let userService = hook.app.service("users");
		return userService.find({
			query: {
				_id: hook.params.account.userId,
				$populate: 'roles'
			}
		}).then(res => {
			let access = false;
			res.data[0].roles.map(role => {
				if (role.name === 'superhero')
					access = true;
			});
			if (access)
				return hook;
			let requesterSchoolId = res.data[0].schoolId;
			let requestedUserSchoolId = (hook.result || {}).schoolId;
			if (!requesterSchoolId.equals(requestedUserSchoolId)) {
				return Promise.reject(new errors.Forbidden(errorMessage));
			}
			return hook;
		});
	};

exports.checkSchoolOwnership = hook => {
	let userId = hook.params.account.userId;
	let objectId = hook.id;
	let service = hook.path;

	let genericService = hook.app.service(service);
	let userService = hook.app.service('users');

	return Promise.all([userService.get(userId), genericService.get(objectId)])
		.then(res => {
			if (res[0].schoolId.equals(res[1].schoolId))
				return hook;
			else
				throw new errors.Forbidden('You do not have valid permissions to access this.');
		});
};

//TODO: later: Template building
//z.B.: maildata.template = { path: "../views/template/mail_new-problem.hbs", "data": { "firstName": "Hannes", .... } };
//if (maildata.template) { [Template-Build (view client/controller/administration.js)] }
// mail.html = generatedHtml || "";
exports.sendEmail = (hook, maildata) => {
	const userService = hook.app.service('/users');
	const mailService = hook.app.service('/mails');

	let roles = (typeof maildata.roles === "string" ? [maildata.roles] : maildata.roles) || [];
	let emails = (typeof maildata.emails === "string" ? [maildata.emails] : maildata.emails) || [];
	let userIds = (typeof maildata.userIds === "string" ? [maildata.userIds] : maildata.userIds) || [];
	let receipients = [];

	let promises = [];

	if (roles.length > 0) {
		promises.push(
			userService.find({query: {
				roles: roles,
				schoolId: hook.data.schoolId,
				$populate: ['roles'],
				$limit : 1000
			}})
		);
	}

	if (userIds.length > 0){
		userIds.map (id => {
			promises.push(
				userService.get(id)
			);
		});
	}

	if (emails.length > 0){
		emails.map(email => {
			let re = /\S+@\S+\.\S+/;
			if (re.test(email)){
				receipients.push(email);
			}
		});
	}

	if(promises.length > 0){
		Promise.all(promises)
		.then(promise => {
			promise.map(result => {
				if (result.data){
					result.data.map(user => {
						receipients.push(user.email);
						});
				} else if (result.email) {
					receipients.push(result.email);
				}
			});

			_.uniq(receipients).map(email => {
				mailService.create({
					email: email,
					subject: maildata.subject || "E-Mail von der Schul-Cloud",
					headers: maildata.headers || {},
					content: {
						"text": maildata.content.text || { "text": "No alternative mailtext provided. Expected: HTML Template Mail." },
						"html": ""
					}
				}).catch (err => {
					throw new errors.BadRequest((err.error||{}).message || err.message || err || "Unknown mailing error");
				});
			});
		return hook;
		})
		.catch(err => {
			throw new errors.BadRequest((err.error||{}).message || err.message || err || "Unknown mailing error");
		});
	}
	else {
		_.uniq(receipients).map(email=> {
			mailService.create({
				email: email,
				subject: maildata.subject || "E-Mail von der Schul-Cloud",
				headers: maildata.headers || {},
				content: {
					"text": maildata.content.text || { "text": "No alternative mailtext provided. Expected: HTML Template Mail." },
					"html": ""
				}
			})
			.catch (err => {
				throw new errors.BadRequest((err.error||{}).message || err.message || err || "Unknown mailing error");
			});
		});
		return hook;
	}
};

exports.getAge = function (dateString) {
	if(dateString==undefined) {
		return undefined;
	}
	const today = new Date();
	const birthDate = new Date(dateString);
	let age = today.getFullYear() - birthDate.getFullYear();
	let m = today.getMonth() - birthDate.getMonth();
	if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
		age--;
	}
	return age;
};

exports.arrayIncludes = (array, includesList, excludesList) =>{
	for(let i=0; i < includesList.length; i++){
		if(array.includes(includesList[i]) === false){
			return false;
		}
	}

	for(let i=0; i<excludesList.length; i++){
		if(array.includes(excludesList[i])){
			return false;
		}
	}
	return true;
};
