const EtherpadClient = require('../utils/EtherpadClient');

class Group {
	constructor(options) {
		this.options = options || {};
		this.docs = {};
	}

	create(params) {
		return EtherpadClient.createOrGetGroup({
			name: params.name,
			groupMapper: params.id,
		});
	}

	setup(app) {
		this.app = app;
	}
}

module.exports = Group;
