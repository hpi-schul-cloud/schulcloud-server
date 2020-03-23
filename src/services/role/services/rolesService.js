const { authenticate } = require('@feathersjs/authentication');
const { hasPermission } = require('../../../hooks');
const { RoleModel } = require('../model');


const RoleServiceHooks = {
	all: [
		authenticate('jwt'),
	],
	find: [],
	get: [],
	create: [
		hasPermission('ROLE_CREATE'),
	],
	patch: [
		hasPermission('ROLE_EDIT'),
	],
	remove: [
		hasPermission('ROLE_CREATE'),
	],
};

class RoleService {
	constructor(docs) {
		this.docs = docs || {};
	}

	get(id, params) {

	}

	find(params) {

	}

	create(data, params) {

	}

	patch(id, data, params) {

	}

	remove(id, params) {

	}

	setup(app) {
		this.app = app;
	}
}

module.exports = {
	RoleService,
	RoleServiceHooks,
};
