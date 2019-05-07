const { request } = require('../helper');

const uri = 'attachments';

class Attachment {
	constructor(options) {
		this.options = options || {};
		// this.docs = {};
	}

	/**
	 * @param {object} attachment It creates one new Attachment
	 */
	create({ lesson, key, value }, params) {
		return request(uri, params, {
			data: { lesson, key, value },
		});
	}

	get(attachmentId, params) {
		return request(uri, params);
	}

	find(params) {
		if (params.clientQuery.lesson) {
			params.query.lesson = params.clientQuery.lesson;
		}
		if (params.clientQuery.key) {
			params.query.key = params.clientQuery.key;
		}
		return request(uri, params);
	}

	remove(attachmentId, params) {
		return request(uri, params);
	}

	patch(attachmentId, { value }, params) {
		return request(uri, params, {
			data: { value },
		});
	}

	setup(app) {
		this.app = app;
	}
}

module.exports = Attachment;
