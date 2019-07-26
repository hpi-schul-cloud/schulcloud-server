/* eslint-disable no-param-reassign */
const {
	Forbidden,
	NotFound,
	BadRequest,
	TypeError,
	NotAuthenticated,
} = require('@feathersjs/errors');
const _ = require('lodash');
const mongoose = require('mongoose');

const logger = require('../logger');
const KeysModel = require('../services/keys/model');
// Add any common hooks you want to share across services in here.

// don't require authentication for internal requests
exports.ifNotLocal = function ifNotLocal(hookForRemoteRequests) {
	return (hook) => {
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

exports.isAdmin = () => (hook) => {
	if (!(hook.params.user.permissions || []).includes('ADMIN')) {
		throw new Forbidden('you are not an administrator');
	}

	return Promise.resolve(hook);
};

exports.isSuperHero = () => (hook) => {
	const userService = hook.app.service('/users/');
	return userService.find({ query: { _id: (hook.params.account.userId || ''), $populate: 'roles' } })
		.then((user) => {
			user.data[0].roles = Array.from(user.data[0].roles);
			if (!(user.data[0].roles.filter(u => (u.name === 'superhero')).length > 0)) {
				throw new Forbidden('you are not a superhero, sorry...');
			}
			return Promise.resolve(hook);
		});
};

exports.hasRole = (hook, userId, roleName) => {
	const userService = hook.app.service('/users/');

	return userService.get((userId || ''), { query: { $populate: 'roles' } })
		.then((user) => {
			user.roles = Array.from(user.roles);

			return (_.some(user.roles, u => u.name === roleName));
		});
};

exports.hasPermission = permissionName => (hook) => {
	// If it was an internal call then skip this hook
	if (!hook.params.provider) {
		return hook;
	}

	// If an api key was provided, skip
	if ((hook.params.headers || {})['x-api-key']) {
		return KeysModel.findOne({ key: hook.params.headers['x-api-key'] })
			.then((res) => {
				if (!res) throw new NotAuthenticated('API Key is invalid');
				return Promise.resolve(hook);
			})
			.catch(() => {
				throw new NotAuthenticated('API Key is invalid.');
			});
	}
	// If test then skip too
	if (process.env.NODE_ENV === 'test') return Promise.resolve(hook);

	// Otherwise check for user permissions
	const service = hook.app.service('/users/');
	return service.get({ _id: (hook.params.account.userId || '') })
		.then((user) => {
			user.permissions = Array.from(user.permissions);

			if (!(user.permissions || []).includes(permissionName)) {
				throw new Forbidden(`You don't have the permission ${permissionName}.`);
			}
			return Promise.resolve(hook);
		});
};

/*
    excludeOptions = false => allways remove response
    excludeOptions = undefined => remove response when not GET or FIND request
    excludeOptions = ['get', ...] => remove when method not in array
 */
exports.removeResponse = excludeOptions => (hook) => {
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

// non hook releated function
exports.hasPermissionNoHook = (hook, userId, permissionName) => {
	const service = hook.app.service('/users/');
	return service.get({ _id: (userId || '') })
		.then((user) => {
			user.permissions = Array.from(user.permissions);
			return (user.permissions || []).includes(permissionName);
		});
};

exports.hasRoleNoHook = (hook, userId, roleName, account = false) => {
	const userService = hook.app.service('/users/');
	const accountService = hook.app.service('/accounts/');
	if (account) {
		return accountService.get(userId)
			.then(_account => userService.find({ query: { _id: (_account.userId || ''), $populate: 'roles' } })
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

// added next handler for save against path of undefined errors
const deepValue = (obj, path, newValue) => {
	// eslint-disable-next-line no-confusing-arrow
	const next = (obj2, path2) => obj2 === undefined ? obj2 : obj2[path2];
	path = path.split('.');
	const len = path.length - 1;
	let i;
	for (i = 0; i < len; i += 1) {
		obj = next(obj, path[i]);
	}

	if (newValue) obj[path[i]] = newValue;
	return next(obj, path[i]);
};

// resolves IDs of objects from serviceName specified by *key* instead of their *_id*
exports.resolveToIds = (serviceName, path, key, context) => {
	// get ids from a probably really deep nested path
	const service = context.app.service(serviceName);

	let values = deepValue(context, path) || [];
	if (typeof values === 'string') values = [values];

	if (!values.length) return Promise.resolve();

	const resolved = values.map((value) => {
		if (!mongoose.Types.ObjectId.isValid(value)) {
			return resolveToId(service, key, value);
		}
		return Promise.resolve(value);
	});

	return Promise.all(resolved)
		.then((_values) => {
			deepValue(context, path, _values);
			return context;
		});
};

// todo: Should removed
exports.permitGroupOperation = (hook) => {
	if (!hook.id) {
		throw new Forbidden('Operation on this service requires an id!');
	}
	return Promise.resolve(hook);
};

// get the model instance to call functions etc  TODO make query results not lean
exports.computeProperty = (Model, functionName, variableName) => hook => Model.findById(hook.result._id)
	.then(modelInstance => modelInstance[functionName]()) // compute that property
	.then((result) => {
		hook.result[variableName] = Array.from(result); // save it in the resulting object
	})
	.catch(e => logger.error(e))
	.then(() => Promise.resolve(hook));

exports.mapPaginationQuery = (context) => {
	if ((context.params.query || {}).$limit === '-1') {
		context.params.paginate = false;
		delete context.params.query.$limit;
		return Promise.resolve(context);
	}
	return Promise.resolve(context);
};

exports.checkCorrectCourseOrTeamId = async (context) => {
	const { courseId, courseGroupId, teamId } = context.data || {};

	if (teamId) {
		const userId = context.params.account.userId.toString();
		const query = {
			userIds: {
				$elemMatch: { userId },
			},
			$select: ['_id'],
		};

		const team = await context.app.service('teams').get(teamId, { query });

		if (team === null) {
			throw new Forbidden("The entered team doesn't belong to you!");
		}
		return context;
	}

	if (courseGroupId || courseId) {
		const userId = context.params.account.userId.toString();
		// make it sense?
		const validatedCourseId = (courseId || '').toString() || (context.id || '').toString();
		let query = {
			teacherIds: {
				$in: [userId],
			},
			$select: ['_id'],
		};

		if (courseGroupId) {
			delete context.data.courseId;
			query = {
				$or: [
					{ teacherIds: { $in: [userId] } },
					{ userIds: { $in: [userId] } },
				],
				$select: ['_id'],
			};
		}

		const course = await context.app.service('courses').get(validatedCourseId, { query });

		if (course === null) {
			throw new Forbidden("The entered course doesn't belong to you!");
		}
		return context;
	}

	return context;
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

const getUser = context => context.app.service('users').get(context.params.account.userId, {
	query: {
		$populate: 'roles',
	},
}).then((user) => {
	if (user === null) {
		throw new Error('User not found.');
	}
	return user;
}).catch((err) => {
	throw new NotFound('Can not fetch user.', err);
});

const testIfRoleNameExist = (user, roleNames) => {
	if (typeof roleNames === 'string') {
		roleNames = [roleNames];
	}
	if ((user.roles[0] || {}).name === undefined) {
		throw new Error('Role is not populated.');
	}
	return user.roles.some(role => roleNames.includes(role));
};

exports.restrictToCurrentSchool = (context) => {
	getUser(context).then((user) => {
		if (testIfRoleNameExist(user, 'superhero')) {
			return context;
		}
		const currentSchoolId = user.schoolId.toString();
		if (context.method === 'get' || context.method === 'find') {
			if (context.params.query.schoolId === undefined) {
				context.params.query.schoolId = user.schoolId;
			} else if (context.params.query.schoolId !== currentSchoolId) {
				throw new Forbidden('You do not have valid permissions to access this.');
			}
		} else if (context.data.schoolId === undefined) {
			context.data.schoolId = currentSchoolId;
		} else if (context.data.schoolId !== currentSchoolId) {
			throw new Forbidden('You do not have valid permissions to access this.');
		}

		return context;
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

exports.restrictToUsersOwnCourses = (context) => {
	getUser(context).then((user) => {
		if (testIfRoleNameExist(user, ['superhero', 'administrator'])) {
			return context;
		}
		const { _id } = user;
		if (context.method === 'find') {
			context.params.query.$and = (context.params.query.$and || []);
			context.params.query.$and.push({
				$or: [
					{ userIds: _id },
					{ teacherIds: _id },
					{ substitutionIds: _id },
				],
			});
		} else {
			const courseService = context.app.service('courses');
			return courseService.get(context.id).then((course) => {
				if (!userIsInThatCourse(user, course, true)) {
					throw new Forbidden('You are not in that course.');
				}
			});
		}

		return context;
	});
};

exports.restrictToUsersOwnLessons = (hook) => {
	getUser(context).then((user) => {
		if (testIfRoleNameExist(user, ['superhero', 'administrator'])) {
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
					throw new Forbidden("You don't have access to that lesson.");
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
					throw new NotFound('There are no lessons that you have access to.');
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

exports.restrictToUsersOwnClasses = (context) => {
	getUser(context).then((user) => {
		if (testIfRoleNameExist(user, ['superhero', 'administrator'])) {
			return context;
		}
		if (context.method === 'get') {
			const classService = context.app.service('classes');
			return classService.get(context.id).then((result) => {
				const userId = context.params.account.userId.toString();
				if (!(_.some(result.userIds, u => JSON.stringify(u) === userId))
                    && !(_.some(result.teacherIds, u => JSON.stringify(u) === userId))) {
					throw new Forbidden('You are not in that class.');
				}
			});
		} if (context.method === 'find') {
			const { _id } = user;
			if (typeof (context.params.query.$or) === 'undefined') {
				context.params.query.$or = [
					{ userIds: _id },
					{ teacherIds: _id },
					{ substitutionIds: _id },
				];
			}
		}
		return context;
	});
};

// meant to be used as an after hook
exports.denyIfNotCurrentSchool = (
	{ errorMessage = 'Die angefragte Ressource gehört nicht zur eigenen Schule!' },
) => (context) => {
	getUser(context).then((user) => {
		if (testIfRoleNameExist(user, 'superhero')) {
			return context;
		}
		const requesterSchoolId = user.schoolId;
		const requestedUserSchoolId = (context.result || {}).schoolId;
		if (!requesterSchoolId.equals(requestedUserSchoolId)) {
			throw new Forbidden(errorMessage);
		}
		return context;
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
			if (res[0].schoolId.equals(res[1].schoolId)) return hook;
			throw new Forbidden('You do not have valid permissions to access this.');
		});
};

// TODO: later: Template building
// z.B.: maildata.template =
//   { path: "../views/template/mail_new-problem.hbs", "data": { "firstName": "Hannes", .... } };
// if (maildata.template) { [Template-Build (view client/controller/administration.js)] }
// mail.html = generatedHtml || "";
exports.sendEmail = (context, maildata) => {
	const userService = context.app.service('/users');
	const mailService = context.app.service('/mails');

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
					schoolId: context.data.schoolId,
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
						logger.warning("(1) No mailcontent (text/html) was given. Don't send a mail.");
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
							logger.warning(err);
							throw new BadRequest(
								(err.error || {}).message
								|| err.message
								|| err
								|| 'Unknown mailing error',
							);
						});
					}
				});
				return context;
			})
			.catch((err) => {
				throw new BadRequest((err.error || {}).message || err.message || err || 'Unknown mailing error');
			});
	} else {
		if (!maildata.content.text && !maildata.content.html) {
			logger.warning("(2) No mailcontent (text/html) was given. Don't send a mail.");
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
					logger.warning(err);
					throw new BadRequest((err.error || {}).message || err.message || err || 'Unknown mailing error');
				});
			});
		}
		return context;
	}

	return context;
};

exports.getAge = (dateString) => {
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
