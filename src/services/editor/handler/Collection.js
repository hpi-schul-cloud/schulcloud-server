/* eslint-disable class-methods-use-this */
const { request } = require('../helper/');

const uri = 'collections';

class Collection {
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

module.exports = Collection;
