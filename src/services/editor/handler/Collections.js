/* eslint-disable class-methods-use-this */
const { request } = require('../helper/');

const uri = 'collection';

class Collections {
	constructor(options) {
		this.options = options || {};
		this.docs = {};
	}

	create({ items }, params) {
		return request(uri, params, {
			data: { items },
		});
	}

	patch(groupId, { items }, params) {
		return request(uri, params, {
			data: { items },
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

module.exports = Collections;
