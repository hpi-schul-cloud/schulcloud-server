'use strict';
const errors = require('feathers-errors');
const mongoose = require('mongoose');
const logger = require('winston');
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

exports.hasPermission = function (permissionName) {
	return hook => {
		if(!(hook.params.user.permissions || []).includes(permissionName)) {
			throw new errors.Forbidden(`You don't have the permission ${permissionName}. Your permissions are ${hook.params.user.permissions}`);
		}
		return Promise.resolve(hook);
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
				hook.result[variableName] = result;		// save it in the resulting object
			})
			.catch(e => logger.error(e))
			.then(_ => Promise.resolve(hook));

	};
};

exports.mapPaginationQuery = (hook) => {
	if(hook.params.query.$limit === '-1') {
		hook.params.paginate = false;
		delete hook.params.query.$limit;
		return Promise.resolve(hook);
	}
};

exports.restrictToCurrentSchool = hook => {
	let userService = hook.app.service("users");
	return userService.find({query: {
		_id: hook.params.account.userId
	}}).then(res => {
		hook.params.query.schoolId = res.data[0].schoolId;
		return hook;
	});
};

// meant to be used as an after hook
exports.denyIfNotCurrentSchool = ({errorMessage = 'Die angefragte Ressource gehört nicht zur eigenen Schule!'}) =>
	hook => {
	let userService = hook.app.service("users");
	return userService.find({query: {
		_id: hook.params.account.userId
	}}).then(res => {
		let requesterSchoolId = res.data[0].schoolId;
		let requestedUserSchoolId = (hook.result || {}).schoolId;
		if(!requesterSchoolId.equals(requestedUserSchoolId)) {
			return Promise.reject(new errors.Forbidden(errorMessage));
		}
		return hook;
	});
};
