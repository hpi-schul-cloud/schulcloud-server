const EtherpadClient = require('../utils/EtherpadClient');

class Author {
	constructor(options) {
		this.options = options || {};
		this.docs = {};
	}

	create(params) {
		return EtherpadClient.createOrGetAuthor({
			name: params.fullName,
			authorMapper: params.id,
		});
	}

	setup(app) {
		this.app = app;
	}
}

module.exports = Author;
