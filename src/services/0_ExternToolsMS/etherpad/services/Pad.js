const EtherpadClient = require('../../logic/EtherpadClient');

class Pad {
	constructor(options) {
		this.options = options || {};
		this.docs = {};
	}

	create(params) {
		return EtherpadClient.createOrGetGroupPad(params);
	}

	setup(app) {
		this.app = app;
	}
}

module.exports = Pad;
