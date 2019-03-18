/* eslint-disable no-param-reassign */
/* eslint-disable class-methods-use-this */
const { request } = require('../helper/');

const uri = 'groups';

class Group {
	constructor(options) {
		this.options = options || {};
		this.docs = {};
	}

	create({ users, lesson }, params) {
		return request(uri, params, {
			data: { users, lesson },
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

	/**
	 * With query.lesson = <id> can you filter all groups of user from a lesson.""
	 */
	find(params) {
		if ((params.clientQuery || {}).lesson) {
			params.query.lesson = params.clientQuery.lesson;
		}
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
