const errors = require('feathers-errors');
const mongoose = require('mongoose');
const logger = require('winston');
const _ = require('lodash');
const KeysModel = require('../services/keys/model');
// Add any common hooks you want to share across services in here.

// don't require authentication for internal requests
exports.ifNotLocal = function ifNotLocal(hookForRemoteRequests) {
	return function ifNotLocalHook(hook) {
		// meaning it's a local call and pass it without execute hookForRemoteRequests
		if (typeof (hook.params.provider) === 'undefined') {
			return hook;
		}
		return hookForRemoteRequests.call(this, hook);
	};
};

exports.forceHookResolve = forcedHook => (hook) => {
	forcedHook(hook)
		.then(() => Promise.resolve(hook))
		.catch(() => Promise.resolve(hook));
};

exports.isAdmin = function isAdmin(options) {
	return (hook) => {
		if (!(hook.params.user.permissions || []).includes('ADMIN')) {
			throw new errors.Forbidden('you are not an administrator');
		}

		return Promise.resolve(hook);
	};
};

exports.isSuperHero = function isSuperHero(options) {
	return (hook) => {
		const userService = hook.app.service('/users/');
		return userService.find({ query: { _id: (hook.params.account.userId || ''), $populate: 'roles' } })
			.then((user) => {
				user.data[0].roles = Array.from(user.data[0].roles);
				if (!(user.data[0].roles.filter(u => (u.name === 'superhero')).length > 0)) {
					throw new errors.Forbidden('you are not a superhero, sorry...');
				}
				return Promise.resolve(hook);
			});
	};
};

exports.hasRole = function hasRole(hook, userId, roleName) {
	const userService = hook.app.service('/users/');

	return userService.get((userId || ''), { query: { $populate: 'roles' } })
		.then((user) => {
			user.roles = Array.from(user.roles);

			return (_.some(user.roles, u => u.name === roleName));
		});
};

exports.hasPermission = function hasPermission(permissionName) {
	return (hook) => {
		// If it was an internal call then skip this hook
		if (!hook.params.provider) {
			return hook;
		}

		// If an api key was provided, skip
		if ((hook.params.headers || {})['x-api-key']) {
			return KeysModel.findOne({ key: hook.params.headers['x-api-key'] })
				.then((res) => {
					if (!res) { throw new errors.NotAuthenticated('API Key is invalid'); }
					return Promise.resolve(hook);
				})
				.catch((err) => {
					throw new errors.NotAuthenticated('API Key is invalid.');
				});
		}
		// If test then skip too
		if (process.env.NODE_ENV === 'test') { return Promise.resolve(hook); }

		// Otherwise check for user permissions
		const service = hook.app.service('/users/');
		return service.get({ _id: (hook.params.account.userId || '') })
			.then((user) => {
				user.permissions = Array.from(user.permissions);

				if (!(user.permissions || []).includes(permissionName)) {
					throw new errors.Forbidden(`You don't have the permission ${permissionName}.`);
				}
				return Promise.resolve(hook);
			});
	};
};

exports.removeResponse = function removeResponse(excludeOptions) {
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

		if (excludeOptions === undefined) {
			excludeOptions = ['get', 'find'];
		}
		if (Array.isArray(excludeOptions) && excludeOptions.includes(hook.method)) {
			return Promise.resolve(hook);
		}
		hook.result = { status: 200 };
		return Promise.resolve(hook);
	};
};

// non hook releated function
exports.hasPermissionNoHook = function hasPermissionNoHook(hook, userId, permissionName) {
	const service = hook.app.service('/users/');
	return service.get({ _id: (userId || '') })
		.then((user) => {
			user.permissions = Array.from(user.permissions);
			return (user.permissions || []).includes(permissionName);
		});
};

exports.hasRoleNoHook = function hasRoleNoHook(hook, userId, roleName, account = false) {
	const userService = hook.app.service('/users/');
	const accountService = hook.app.service('/accounts/');
	if (account) {
		return accountService.get(userId)
			.then(userAccount => userService.find({ query: { _id: (userAccount.userId || ''), $populate: 'roles' } })
				.then((user) => {
					user.data[0].roles = Array.from(user.data[0].roles);

					return (user.data[0].roles.filter(u => (u.name === roleName)).length > 0);
				}));
	}
	return userService.find({ query: { _id: (userId || ''), $populate: 'roles' } })
		.then((user) => {
			user.data[0].roles = Array.from(user.data[0].roles);

			return (user.data[0].roles.filter(u => (u.name === roleName)).length > 0);
		});
};

const resolveToId = (service, key, value) => {
	const query = {};
	query[key] = value;
	return service.find({ query })
		.then((results) => {
			const result = results.data[0];
			if (!result) throw new TypeError(`No records found where ${key} is ${value}.`);
			return result._id;
		});
};


const deepValue = (obj, path, newValue) => {
	path = path.split('.');
	const len = path.length - 1;

	let i;
	for (i = 0; i < len; i += 1) {
		obj = obj[path[i]];
	}

	if (newValue) obj[path[i]] = newValue;
	return obj[path[i]];
};

// resolves IDs of objects from serviceName specified by *key* instead of their *_id*
exports.resolveToIds = (serviceName, path, key, hook) => {
	// get ids from a probably really deep nested path
	const service = hook.app.service(serviceName);

	let values = deepValue(hook, path) || [];
	if (typeof values === 'string') values = [values];

	if (!values.length) return hook;

	const resolved = values.map((value) => {
		if (!mongoose.Types.ObjectId.isValid(value)) {
			return resolveToId(service, key, value);
		}
		return Promise.resolve(value);
	});

	return Promise.all(resolved)
		.then((resolvedValues) => {
			deepValue(hook, path, resolvedValues);
		});
};

exports.permitGroupOperation = (hook) => {
	if (!hook.id) {
		throw new errors.Forbidden('Operation on this service requires an id!');
	}
	return Promise.resolve(hook);
};

exports.computeProperty = function computeProperty(Model, functionName, variableName) {
	return hook => Model.findById(hook.result._id)
	// get the model instance to call functions etc TODO make query results not lean
		.then(modelInstance => modelInstance[functionName]())	// compute that property
		.then((result) => {
			hook.result[variableName] = Array.from(result);		// save it in the resulting object
		})
		.catch(e => logger.error(e))
		.then(() => Promise.resolve(hook));
};

exports.mapPaginationQuery = (hook) => {
	if ((hook.params.query || {}).$limit === '-1') {
		hook.params.paginate = false;
		delete hook.params.query.$limit;
	}
	return Promise.resolve(hook);
};

exports.checkCorrectCourseOrTeamId = async (hook) => {
	if (hook.data.teamId) {
		const teamService = hook.app.service('teams');

		const query = {
			userIds: {
				$elemMatch: { userId: hook.params.account.userId },
			},
		};

		const teams = await teamService.find({ query });

		if (teams.data.some(team => team._id.toString() === hook.data.teamId)) {
			return hook;
		}
		throw new errors.Forbidden("The entered team doesn't belong to you!");
	} else if (hook.data.courseGroupId || hook.data.courseId) {
		const courseService = hook.app.service('courses');
		const courseId = (hook.data.courseId || '').toString() || (hook.id || '').toString();
		let query = { teacherIds: { $in: [hook.params.account.userId] } };

		if (hook.data.courseGroupId) {
			delete hook.data.courseId;
			query = {
				$or: [{ teacherIds: { $in: [hook.params.account.userId] } },
					{ userIds: { $in: [hook.params.account.userId] } }],
			};
		}

		const courses = await courseService.find({ query });

		if (courses.data.some(course => course._id.toString() === courseId)) {
			return hook;
		}
		throw new errors.Forbidden("The entered course doesn't belong to you!");
	} else {
		return hook;
	}
};

exports.injectUserId = (hook) => {
	if (typeof (hook.params.provider) === 'undefined') {
		if (hook.data && hook.data.userId) {
			hook.params.account = { userId: hook.data.userId };
			hook.params.payload = { userId: hook.data.userId };
			delete hook.data.userId;
		}
	}

	return hook;
};

exports.restrictToCurrentSchool = (hook) => {
	const userService = hook.app.service('users');
	return userService.find({
		query: {
			_id: hook.params.account.userId,
			$populate: 'roles',
		},
	}).then((res) => {
		let access = false;
		res.data[0].roles.forEach((role) => {
			if (role.name === 'superhero') { access = true; }
		});
		if (access) { return hook; }
		if (hook.method === 'get' || hook.method === 'find') {
			if (hook.params.query.schoolId === undefined) {
				hook.params.query.schoolId = res.data[0].schoolId;
			} else if (hook.params.query.schoolId !== res.data[0].schoolId) {
				throw new errors.Forbidden('You do not have valid permissions to access this.');
			}
		} else if (hook.data.schoolId === undefined) {
			hook.data.schoolId = res.data[0].schoolId.toString();
		} else if (hook.data.schoolId !== res.data[0].schoolId) {
			throw new errors.Forbidden('You do not have valid permissions to access this.');
		}

		return hook;
	});
};

const userIsInThatCourse = (user, course, isCourse) => {
	if (isCourse) {
		return course.userIds.some(u => u.toString() === user._id.toString())
			|| course.teacherIds.some(u => u.toString() === user._id.toString())
			|| (course.substitutionIds || []).some(u => u.toString() === user._id.toString());
	}

	return course.userIds.some(u => u.toString() === user._id.toString())
		|| user.roles.some(role => role.name === 'teacher');
};

exports.restrictToUsersOwnCourses = (hook) => {
	const userService = hook.app.service('users');
	return userService.find({
		query: {
			_id: hook.params.account.userId,
			$populate: 'roles',
		},
	}).then((res) => {
		let access = false;
		res.data[0].roles.forEach((role) => {
			if (role.name === 'administrator' || role.name === 'superhero') {
				access = true;
			}
		});
		if (access) {
			return hook;
		}

		if (hook.method === 'get') {
			const courseService = hook.app.service('courses');
			const { userId } = hook.params.account;
			return courseService.get(hook.id).then((course) => {
				if (!(_.some(course.userIds, u => JSON.stringify(u) === JSON.stringify(userId)))
					&& !(_.some(course.teacherIds, u => JSON.stringify(u) === JSON.stringify(userId)))
					&& !(_.some(course.substitutionIds, u => JSON.stringify(u) === JSON.stringify(userId)))) {
					throw new errors.Forbidden('You are not in that course.');
				}
			});
		}
		if (hook.method === 'find') {
			if (typeof (hook.params.query.$or) === 'undefined') {
				hook.params.query.$or = [
					{ userIds: res.data[0]._id },
					{ teacherIds: res.data[0]._id },
					{ substitutionIds: res.data[0]._id },
				];
			}
		}
		return hook;
	});
};

exports.restrictToUsersOwnLessons = (hook) => {
	const userService = hook.app.service('users');
	return userService.find({
		query: {
			_id: hook.params.account.userId,
			$populate: 'roles',
		},
	}).then((userResult) => {
		let access = false;
		const user = userResult.data[0];
		user.roles.forEach((role) => {
			if (role.name === 'administrator' || role.name === 'superhero') {
				access = true;
			}
		});
		if (access) {
			return hook;
		}
		// before-hook
		if (hook.type === 'before') {
			let populate = hook.params.query.$populate;
			if (typeof (populate) === 'undefined') {
				populate = ['courseId', 'courseGroupId'];
			} else if (Array.isArray(populate) && !populate.includes('courseId')) {
				populate.push('courseId');
				populate.push('courseGroupId');
			}
			hook.params.query.$populate = populate;
		} else {
			// after-hook
			if (hook.method === 'get' && (hook.result || {})._id) {
				let tempLesson = [hook.result];
				tempLesson = tempLesson.filter((lesson) => {
					if ('courseGroupId' in lesson) {
						return userIsInThatCourse(user, lesson.courseGroupId, false);
					}
					return userIsInThatCourse(user, lesson.courseId, true)
						|| (hook.params.query.shareToken || {}) === (lesson.shareToken || {});
				});
				if (tempLesson.length === 0) {
					throw new errors.Forbidden("You don't have access to that lesson.");
				}
				if ('courseGroupId' in hook.result) {
					hook.result.courseGroupId = hook.result.courseGroupId._id;
				} else {
					hook.result.courseId = hook.result.courseId._id;
				}
			}

			if (hook.method === 'find' && ((hook.result || {}).data || []).length > 0) {
				hook.result.data = hook.result.data.filter((lesson) => {
					if ('courseGroupId' in lesson) {
						return userIsInThatCourse(user, lesson.courseGroupId, false);
					}
					return userIsInThatCourse(user, lesson.courseId, true)
						|| (hook.params.query.shareToken || {}) === (lesson.shareToken || {});
				});

				if (hook.result.data.length === 0) {
					throw new errors.NotFound('There are no lessons that you have access to.');
				} else {
					hook.result.total = hook.result.data.length;
				}
				hook.result.data.forEach((lesson) => {
					if ('courseGroupId' in lesson) {
						lesson.courseGroupId = lesson.courseGroupId._id;
					} else {
						lesson.courseId = lesson.courseId._id;
					}
				});
			}
		}
		return hook;
	});
};

exports.restrictToUsersOwnClasses = (hook) => {
	const userService = hook.app.service('users');
	return userService.find({
		query: {
			_id: hook.params.account.userId,
			$populate: 'roles',
		},
	}).then((res) => {
		let access = false;
		res.data[0].roles.forEach((role) => {
			if (['administrator', 'superhero'].includes(role.name)) { access = true; }
		});
		if (access) { return hook; }

		if (hook.method === 'get') {
			const { userId } = hook.params.account;
			const classService = hook.app.service('classes');
			return classService.get(hook.id).then((result) => {
				if (!(_.some(result.userIds, u => JSON.stringify(u) === JSON.stringify(userId)))
					&& !(_.some(result.teacherIds, u => JSON.stringify(u) === JSON.stringify(userId)))) {
					throw new errors.Forbidden('You are not in that class.');
				}
			});
		} if (hook.method === 'find') {
			if (typeof (hook.params.query.$or) === 'undefined') {
				hook.params.query.$or = [
					{ userIds: res.data[0]._id },
					{ teacherIds: res.data[0]._id },
					{ substitutionIds: res.data[0]._id },
				];
			}
		}
		return hook;
	});
};

// meant to be used as an after hook
exports.denyIfNotCurrentSchool = (hook) => {
	const userService = hook.app.service('users');
	return userService.find({
		query: {
			_id: hook.params.account.userId,
			$populate: 'roles',
		},
	}).then((res) => {
		let access = false;
		res.data[0].roles.forEach((role) => {
			if (role.name === 'superhero') { access = true; }
		});
		if (access) { return hook; }
		const requesterSchoolId = res.data[0].schoolId;
		const requestedUserSchoolId = (hook.result || {}).schoolId;
		if (!requesterSchoolId.equals(requestedUserSchoolId)) {
			return Promise.reject(new errors.Forbidden('Die angefragte Ressource gehört nicht zur eigenen Schule!'));
		}
		return hook;
	});
};

exports.checkSchoolOwnership = (hook) => {
	const { userId } = hook.params.account;
	const objectId = hook.id;
	const service = hook.path;

	const genericService = hook.app.service(service);
	const userService = hook.app.service('users');

	return Promise.all([userService.get(userId), genericService.get(objectId)])
		.then((res) => {
			if (res[0].schoolId.equals(res[1].schoolId)) { return hook; }
			throw new errors.Forbidden('You do not have valid permissions to access this.');
		});
};

// TODO: later: Template building
// zB: maildata.template = { path: "../views/template/mail_new-problem.hbs", "data": { "firstName": "Hannes", .... } };
// if (maildata.template) { [Template-Build (view client/controller/administration.js)] }
// mail.html = generatedHtml || "";
exports.sendEmail = (hook, maildata) => {
	const userService = hook.app.service('/users');
	const mailService = hook.app.service('/mails');

	const roles = (typeof maildata.roles === 'string' ? [maildata.roles] : maildata.roles) || [];
	const emails = (typeof maildata.emails === 'string' ? [maildata.emails] : maildata.emails) || [];
	const userIds = (typeof maildata.userIds === 'string' ? [maildata.userIds] : maildata.userIds) || [];
	const receipients = [];

	const promises = [];

	if (roles.length > 0) {
		promises.push(
			userService.find({
				query: {
					roles,
					schoolId: hook.data.schoolId,
					$populate: ['roles'],
					$limit: 1000,
				},
			}),
		);
	}

	if (userIds.length > 0) {
		userIds.forEach((id) => {
			promises.push(
				userService.get(id),
			);
		});
	}

	if (emails.length > 0) {
		emails.forEach((email) => {
			const re = /\S+@\S+\.\S+/;
			if (re.test(email)) {
				receipients.push(email);
			}
		});
	}

	if (promises.length > 0) {
		Promise.all(promises)
			.then((promise) => {
				promise.forEach((result) => {
					if (result.data) {
						result.data.forEach((user) => {
							receipients.push(user.email);
						});
					} else if (result.email) {
						receipients.push(result.email);
					}
				});

				_.uniq(receipients).forEach((email) => {
					if (!maildata.content.text && !maildata.content.html) {
						logger.warn("(1) No mailcontent (text/html) was given. Don't send a mail.");
					} else {
						mailService.create({
							email,
							subject: maildata.subject || 'E-Mail von der Schul-Cloud',
							headers: maildata.headers || {},
							content: {
								text: maildata.content.text
								|| 'No alternative mailtext provided. Expected: HTML Template Mail.',
								html: '', // still todo, html template mails
							},
						}).catch((err) => {
							logger.warn(err);
							throw new errors.BadRequest((err.error || {}).message
							|| err.message || err || 'Unknown mailing error');
						});
					}
				});
				return hook;
			})
			.catch((err) => {
				throw new errors.BadRequest((err.error || {}).message || err.message || err || 'Unknown mailing error');
			});
	} else {
		if (!maildata.content.text && !maildata.content.html) {
			logger.warn("(2) No mailcontent (text/html) was given. Don't send a mail.");
		} else {
			_.uniq(receipients).forEach((email) => {
				mailService.create({
					email,
					subject: maildata.subject || 'E-Mail von der Schul-Cloud',
					headers: maildata.headers || {},
					content: {
						text: maildata.content.text
						|| 'No alternative mailtext provided. Expected: HTML Template Mail.',
						html: '', // still todo, html template mails
					},
				}).catch((err) => {
					logger.warn(err);
					throw new errors.BadRequest((err.error || {}).message
					|| err.message || err || 'Unknown mailing error');
				});
			});
		}
		return hook;
	}
	return hook;
};

exports.getAge = function getAge(dateString) {
	if (dateString === undefined) {
		return undefined;
	}
	const today = new Date();
	const birthDate = new Date(dateString);
	let age = today.getFullYear() - birthDate.getFullYear();
	const m = today.getMonth() - birthDate.getMonth();
	if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
		age -= 1;
	}
	return age;
};

exports.arrayIncludes = (array, includesList, excludesList) => {
	for (let i = 0; i < includesList.length; i += 1) {
		if (array.includes(includesList[i]) === false) {
			return false;
		}
	}

	for (let i = 0; i < excludesList.length; i += 1) {
		if (array.includes(excludesList[i])) {
			return false;
		}
	}
	return true;
};
