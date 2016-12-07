'use strict';
const errors = require('feathers-errors');
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

exports.resolveRoleIds = function(app) {
	return (hook) => {
		const roles = hook.data.roles || [];
		let resolved = roles.map(role => {
			if(role.toString().length != 24) {	// TODO: better test for ObjectID
				return _resolveRoleId(app, role);
			} else {
				return Promise.resolve(role);
			}
		});

		return Promise.all(resolved)
			.then(roles => {
				hook.data.roles = roles;
			});
	};
};

function _resolveRoleId(app, name) {
	const roleService = app.service('/roles');
	return roleService.find({query: {name: name}})
		.then(result => {
			const role = result.data[0];
			if(!role) throw new TypeError(`Role ${name} is not a valid role`);
			return role._id;
		});
}

exports.computeProperty = function (Model, functionName, variableName) {
	return (hook) => {
		return Model.findById(hook.result._id)	// get the model instance to call functions etc  TODO make query results not lean
			.then(modelInstance => modelInstance[functionName]())	// compute that property
			.then(result => {
				hook.result[variableName] = result;		// save it in the resulting object
				return Promise.resolve(hook);
			})
			.catch(e => logger.error(e));

	};
};
