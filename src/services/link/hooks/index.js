'use strict';

const globalHooks = require('../../../hooks');
const hooks = require('feathers-hooks');
const auth = require('feathers-authentication').hooks;
const model = require('../link-model');
const service = require('../index');

const findByShortId = service => {
	return hook => {
		// use hook.params here
		if(hook.params.id.length == service.Model.linkLength) {

		}
		return Promise.resolve(hook);
	};
};

const generateShortId = service => {
	return hook => {
		return generateUniqueId(service)
			.then(uniqueId => {
				hook.data.id = uniqueId;
			})
			.then(_ => Promise.resolve(hook));
	};
};

function generateUniqueId(service) {
	let id = null;
	return new Promise((resolve, reject) => {
		require('crypto').randomBytes(3, (err, buffer) => {
			id = buffer.toString('hex');
			if(err) {
				reject(err);
			} else {
				resolve(id);
			}
		});
	})
		.then(id => service.get(id))
		.then(result => {
			if(result.data.length > 0) {
				return generateUniqueId(service);	// ugly recursion until a unique id is found
			} else {
				return Promise.resolve(id);
			}
		})
		.catch(error => {
			return Promise.resolve(id);
		});
}

exports.before = service => {
	return {
		all: [
			auth.verifyToken(),
			auth.populateUser(),
			auth.restrictToAuthenticated()
		],
		find: [],
		get: [globalHooks.resolveToIds.bind(this, '/links', 'data.id', 'id')],
		create: [generateShortId(service)],
		update: [],
		patch: [],
		remove: []
	};
};

exports.after = {
  all: [],
  find: [],
  get: [],
  create: [],
  update: [],
  patch: [],
  remove: []
};
