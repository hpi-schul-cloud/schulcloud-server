const { request } = require('../helper/');

const uri = 'collections';

class Collection {
	constructor(options) {
		this.options = options || {};
		// this.docs = {};
	}

	create({ groups, lesson, owner }, params) {
		return request(uri, params, {
			data: { groups, lesson, owner },
		});
	}

	patch(collectionId, { groups }, params) {
		return request(uri, params, {
			data: { groups },
		});
	}

	get(collectionId, params) {
		return request(uri, params);
	}

	find(params) {
		if ((params.clientQuery || {}).lesson) {
			params.query.lesson = params.clientQuery.lesson;
		}
		return request(uri, params);
	}

	remove(collectionId, params) {
		return request(uri, params);
	}

	setup(app) {
		this.app = app;
	}
}

module.exports = Collection;
