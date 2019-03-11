/* eslint-disable class-methods-use-this */
const { request } = require('../helper/');

const uri = 'groups';

class Group {
	constructor(options) {
		this.options = options || {};
		this.docs = {};
	}

	create({ users }, params) {
		return request(uri, params, {
			data: { users },
		});
	}

	patch(groupId, { users }, params) {
		return request(uri, params, {
			data: { users },
		});
	}

	get(groupId, params) {
		return request(uri, params);
	}

	find(params) {
		return request(uri, params);
	}

	remove(groupId, params) {
		return request(uri, params);
	}

	setup(app) {
		this.app = app;
	}
}

module.exports = Group;
