'use strict';
const errors = require('feathers-errors');
const mongoose = require('mongoose');
const logger = require('winston');
const KeysModel = require('../services/keys/model');
// Add any common hooks you want to share across services in here.

// don't require authentication for internal requests
exports.ifNotLocal = function (hookForRemoteRequests) {
	return function (hook) {
		if (typeof(hook.params.provider) != 'undefined') {	// meaning it's not a local call
			// Call the specified hook
			return hookForRemoteRequests.call(this, hook);
		}
	};
};

exports.isAdmin = function (options) {
	return hook => {
		if(!(hook.params.user.permissions || []).includes('ADMIN')) {
			throw new errors.Forbidden('you are not an administrator');
		}

		return Promise.resolve(hook);
	};
};

exports.isSuperHero = function (options) {
	return hook => {
		const userService = hook.app.service('/users/');
		return userService.find({query: {_id: (hook.params.account.userId || ""), $populate: 'roles'}})
			.then(user => {
				user.data[0].roles = Array.from(user.data[0].roles);
				if(!(user.data[0].roles.filter(u => (u.name === 'superhero')).length > 0)) {
					throw new errors.Forbidden('you are not a superhero, sorry...');
				}
				return Promise.resolve(hook);
			});
	};
};

exports.hasPermission = function (permissionName) {
	return hook => {
		// If it was an internal call then skip this hook
		if (!hook.params.provider) {
			return hook;
		}

		// If an api key was provided, skip
		if ((hook.params.headers || {})["x-api-key"]) {
			return KeysModel.findOne({ key: hook.params.headers["x-api-key"]})
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
			return service.get({_id: (hook.params.account.userId || "")})
				.then(user => {
					user.permissions = Array.from(user.permissions);

					if(!(user.permissions || []).includes(permissionName)) {
						throw new errors.Forbidden(`You don't have the permission ${permissionName}.`);
					}
					return Promise.resolve(hook);
				});
	};
};

// resolves IDs of objects from serviceName specified by *key* instead of their *_id*
exports.resolveToIds = (serviceName, path, key, hook) => {
	// get ids from a probably really deep nested path
	const service = hook.app.service(serviceName);

	let values = deepValue(hook, path) || [];
	if(typeof values == 'string') values = [values];

	if(!values.length) return;

	let resolved = values.map(value => {
		if(!mongoose.Types.ObjectId.isValid(value)) {
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


const _resolveToId = (service, key, value) => {
	let query = {};
	query[key] = value;
	return service.find({query})
	.then(results => {
		const result = results.data[0];
		if(!result) throw new TypeError(`No records found where ${key} is ${value}.`);
		return result._id;
	});
};


const deepValue = (obj, path, newValue) => {
	path = path.split('.');
	const len = path.length - 1;

	let i;
	for(i  = 0; i < len; i++) {
		obj = obj[path[i]];
	}

	if(newValue) obj[path[i]] = newValue;
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
	if((hook.params.query || {}).$limit === '-1') {
		hook.params.paginate = false;
		delete hook.params.query.$limit;
		return Promise.resolve(hook);
	}
};

exports.restrictToCurrentSchool = hook => {
	let userService = hook.app.service("users");
	return userService.find({query: {
		_id: hook.params.account.userId,
		$populate: 'roles'
	}}).then(res => {
		let access = false;
		res.data[0].roles.map(role => {
			if (role.name === 'superhero')
				access = true;
		});
		if (access)
			return hook;
		hook.params.query.schoolId = res.data[0].schoolId;
		return hook;
	});
};

// meant to be used as an after hook
exports.denyIfNotCurrentSchool = ({errorMessage = 'Die angefragte Ressource gehört nicht zur eigenen Schule!'}) =>
	hook => {
	let userService = hook.app.service("users");
	return userService.find({query: {
		_id: hook.params.account.userId,
		$populate: 'roles'
	}}).then(res => {
		let access = false;
		res.data[0].roles.map(role => {
			if (role.name === 'superhero')
				access = true;
		});
		if (access)
			return hook;
		let requesterSchoolId = res.data[0].schoolId;
		let requestedUserSchoolId = (hook.result || {}).schoolId;
		if(!requesterSchoolId.equals(requestedUserSchoolId)) {
			return Promise.reject(new errors.Forbidden(errorMessage));
		}
		return hook;
	});
};
