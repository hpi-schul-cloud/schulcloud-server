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

const { extractTokenFromBearerHeader } = require('../services/authentication/logic');

// don't require authentication for internal requests
exports.ifNotLocal = function ifNotLocal(hookForRemoteRequests) {
	return (context) => {
		// meaning it's a local call and pass it without execute hookForRemoteRequests
		if (typeof (context.params.provider) === 'undefined') {
			return context;
		}
		return hookForRemoteRequests.call(this, context);
	};
};

exports.forceHookResolve = (forcedHook) => (context) => {
	forcedHook(context)
		.then(() => Promise.resolve(context))
		.catch(() => Promise.resolve(context));
};

exports.isAdmin = () => (context) => {
	if (!(context.params.user.permissions || []).includes('ADMIN')) {
		throw new Forbidden('you are not an administrator');
	}

	return Promise.resolve(context);
};

exports.isSuperHero = () => (context) => {
	const userService = context.app.service('/users/');
	return userService.find({ query: { _id: (context.params.account.userId || ''), $populate: 'roles' } })
		.then((user) => {
			user.data[0].roles = Array.from(user.data[0].roles);
			if (!(user.data[0].roles.filter((u) => (u.name === 'superhero')).length > 0)) {
				throw new Forbidden('you are not a superhero, sorry...');
			}
			return Promise.resolve(context);
		});
};

exports.hasRole = (context, userId, roleName) => {
	const userService = context.app.service('/users/');

	return userService.get((userId || ''), { query: { $populate: 'roles' } })
		.then((user) => {
			user.roles = Array.from(user.roles);

			return (_.some(user.roles, (u) => u.name === roleName));
		});
};

exports.hasPermission = (permissionName) => (context) => {
	// If it was an internal call then skip this context
	if (!context.params.provider) {
		return context;
	}

	// If an api key was provided, skip
	if ((context.params.headers || {})['x-api-key']) {
		return KeysModel.findOne({ key: context.params.headers['x-api-key'] })
			.then((res) => {
				if (!res) throw new NotAuthenticated('API Key is invalid');
				return Promise.resolve(context);
			})
			.catch(() => {
				throw new NotAuthenticated('API Key is invalid.');
			});
	}

	// Otherwise check for user permissions
	const service = context.app.service('/users/');
	return service.get({ _id: (context.params.account.userId || '') })
		.then((user) => {
			user.permissions = Array.from(user.permissions);

			if (!(user.permissions || []).includes(permissionName)) {
				throw new Forbidden(`You don't have the permission ${permissionName}.`);
			}
			return Promise.resolve(context);
		});
};

/*
    excludeOptions = false => allways remove response
    excludeOptions = undefined => remove response when not GET or FIND request
    excludeOptions = ['get', ...] => remove when method not in array
 */
exports.removeResponse = (excludeOptions) => (context) => {
	// If it was an internal call then skip this context
	if (!context.params.provider) {
		return context;
	}

	if (excludeOptions === undefined) {
		excludeOptions = ['get', 'find'];
	}
	if (Array.isArray(excludeOptions) && excludeOptions.includes(context.method)) {
		return Promise.resolve(context);
	}
	context.result = { status: 200 };
	return Promise.resolve(context);
};

// non hook releated function
exports.hasPermissionNoHook = (context, userId, permissionName) => {
	const service = context.app.service('/users/');
	return service.get({ _id: (userId || '') })
		.then((user) => {
			user.permissions = Array.from(user.permissions);
			return (user.permissions || []).includes(permissionName);
		});
};

exports.hasRoleNoHook = (context, userId, roleName, account = false) => {
	const userService = context.app.service('/users/');
	const accountService = context.app.service('/accounts/');
	if (account) {
		return accountService.get(userId)
			.then((_account) => userService.find({ query: { _id: (_account.userId || ''), $populate: 'roles' } })
				.then((user) => {
					user.data[0].roles = Array.from(user.data[0].roles);

					return (user.data[0].roles.filter((u) => (u.name === roleName)).length > 0);
				}));
	}
	return userService.find({ query: { _id: (userId || ''), $populate: 'roles' } })
		.then((user) => {
			user.data[0].roles = Array.from(user.data[0].roles);

			return (user.data[0].roles.filter((u) => (u.name === roleName)).length > 0);
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
exports.permitGroupOperation = (context) => {
	if (!context.id) {
		throw new Forbidden('Operation on this service requires an id!');
	}
	return Promise.resolve(context);
};

// get the model instance to call functions etc  TODO make query results not lean
exports.computeProperty = (Model, functionName, variableName) => (context) => Model.findById(context.result._id)
	.then((modelInstance) => modelInstance[functionName]()) // compute that property
	.then((result) => {
		context.result[variableName] = Array.from(result); // save it in the resulting object
	})
	.catch((e) => logger.error(e))
	.then(() => Promise.resolve(context));

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

exports.injectUserId = (context) => {
	if (typeof (context.params.provider) === 'undefined') {
		if (context.data && context.data.userId) {
			context.params.account = { userId: context.data.userId };
			context.params.payload = { userId: context.data.userId };
			delete context.data.userId;
		}
	}

	return context;
};

const getUser = (context) => context.app.service('users').get(context.params.account.userId, {
	query: {
		$populate: 'roles',
		// todo select in roles only role name
		// test which keys from user should selected
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
	return user.roles.some(({ name }) => roleNames.includes(name));
};

exports.restrictToCurrentSchool = (context) => getUser(context).then((user) => {
	if (testIfRoleNameExist(user, 'superhero')) {
		return context;
	}
	const currentSchoolId = user.schoolId.toString();
	const { params } = context;
	if (params.route && params.route.schoolId && params.route.schoolId !== currentSchoolId) {
		throw new Forbidden('You do not have valid permissions to access this.');
	}
	if (['get', 'find', 'remove'].includes(context.method)) {
		if (params.query.schoolId === undefined) {
			params.query.schoolId = user.schoolId;
		} else if (params.query.schoolId !== currentSchoolId) {
			throw new Forbidden('You do not have valid permissions to access this.');
		}
	} else if (context.data.schoolId === undefined) {
		context.data.schoolId = currentSchoolId;
	} else if (context.data.schoolId !== currentSchoolId) {
		throw new Forbidden('You do not have valid permissions to access this.');
	}

	return context;
});

/* todo: Many request pass id as second parameter, but it is confused with the logic that should pass.
	It should evaluate and make clearly.
 */
const userIsInThatCourse = (user, { userIds = [], teacherIds = [], substitutionIds = [] }, isCourse) => {
	const userId = user._id.toString();
	if (isCourse) {
		return userIds.some((u) => u.toString() === userId)
            || teacherIds.some((u) => u.toString() === userId)
            || substitutionIds.some((u) => u.toString() === userId);
	}

	return userIds.some((u) => u.toString() === userId) || testIfRoleNameExist(user, 'teacher');
};

exports.restrictToUsersOwnCourses = (context) => getUser(context).then((user) => {
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

exports.mapPayload = (context) => {
	logger.log('warning',
		'DEPRECATED: this hook should be used to ensure backwards compatibility only, and be removed if possible.');
	if (context.params.payload) {
		context.params.authentication = Object.assign({}, context.params.authentication, { payload: context.params.payload });
	}
	Object.defineProperty(context.params, 'payload', {
		get() {
			logger.log('warning', 'params.payload is DEPRECATED, please use params.authentication.payload instead!');
			return (context.params.authentication || {}).payload;
		},
		set(v) {
			logger.log('warning', 'params.payload is DEPRECATED, please use params.authentication.payload instead!');
			if (!context.params.authentication) context.params.authentication = {};
			context.params.authentication.payload = v;
		},
	});
	return context;
};

exports.restrictToUsersOwnLessons = (context) => getUser(context).then((user) => {
	if (testIfRoleNameExist(user, ['superhero', 'administrator'])) {
		return context;
	}
	// before-hook
	if (context.type === 'before') {
		let populate = context.params.query.$populate;
		if (typeof (populate) === 'undefined') {
			populate = ['courseId', 'courseGroupId'];
		} else if (Array.isArray(populate) && !populate.includes('courseId')) {
			populate.push('courseId');
			populate.push('courseGroupId');
		}
		context.params.query.$populate = populate;
	} else {
		// after-hook
		if (context.method === 'get' && (context.result || {})._id) {
			let tempLesson = [context.result];
			tempLesson = tempLesson.filter((lesson) => {
				if ('courseGroupId' in lesson) {
					return userIsInThatCourse(user, lesson.courseGroupId, false);
				}
				return userIsInThatCourse(user, lesson.courseId, true)
                        || (context.params.query.shareToken || {}) === (lesson.shareToken || {});
			});
			if (tempLesson.length === 0) {
				throw new Forbidden("You don't have access to that lesson.");
			}
			if ('courseGroupId' in context.result) {
				context.result.courseGroupId = context.result.courseGroupId._id;
			} else {
				context.result.courseId = context.result.courseId._id;
			}
		}

		if (context.method === 'find' && ((context.result || {}).data || []).length > 0) {
			context.result.data = context.result.data.filter((lesson) => {
				if ('courseGroupId' in lesson) {
					return userIsInThatCourse(user, lesson.courseGroupId, false);
				}
				return userIsInThatCourse(user, lesson.courseId, true)
                        || (context.params.query.shareToken || {}) === (lesson.shareToken || {});
			});

			if (context.result.data.length === 0) {
				throw new NotFound('There are no lessons that you have access to.');
			} else {
				context.result.total = context.result.data.length;
			}
			context.result.data.forEach((lesson) => {
				if ('courseGroupId' in lesson) {
					lesson.courseGroupId = lesson.courseGroupId._id;
				} else {
					lesson.courseId = lesson.courseId._id;
				}
			});
		}
	}
	return context;
});

exports.restrictToUsersOwnClasses = (context) => getUser(context).then((user) => {
	if (testIfRoleNameExist(user, ['superhero', 'administrator', 'teacher'])) {
		return context;
	}
	if (context.method === 'get') {
		const classService = context.app.service('classes');
		return classService.get(context.id).then((result) => {
			const userId = context.params.account.userId.toString();
			if (!(_.some(result.userIds, (u) => u.toString() === userId))
					&& !(_.some(result.teacherIds, (u) => u.toString() === userId))) {
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

// meant to be used as an after context
exports.denyIfNotCurrentSchool = (
	{ errorMessage = 'Die angefragte Ressource gehört nicht zur eigenen Schule!' },
) => (context) => getUser(context).then((user) => {
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

exports.checkSchoolOwnership = (context) => {
	const { userId } = context.params.account;
	const objectId = context.id;
	const service = context.path;

	const genericService = context.app.service(service);
	const userService = context.app.service('users');

	return Promise.all([userService.get(userId), genericService.get(objectId)])
		.then((res) => {
			if (res[0].schoolId.equals(res[1].schoolId)) return context;
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

/** used for user decoration of create, update, patch requests for mongoose-diff-history */
exports.decorateWithCurrentUserId = (context) => {
	// todo decorate document removal
	// todo simplify user extraction to do this only once
	try {
		if (!context.params.account) {
			context.params.account = {};
		}
		const { userId } = context.params.account;
		// if user not defined, try extract userId from jwt
		if (!userId && (context.params.headers || {}).authorization) {
			// const jwt = extractTokenFromBearerHeader(context.params.headers.authorization);
			// userId = 'jwt'; // fixme
		}
		// eslint-disable-next-line no-underscore-dangle
		if (userId && context.data && !context.data.__user) {
			// eslint-disable-next-line no-underscore-dangle
			context.data.__user = userId;
		}
	} catch (err) {
		logger.error(err);
	}
	return context;
};
