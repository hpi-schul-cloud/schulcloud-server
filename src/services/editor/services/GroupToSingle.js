class GroupToSingle {
	constructor(options) {
		this.options = options || {};
		// this.docs = {};
	}

	create({ group }, params) {
		return Promise.resolve({
			// für jedes element in group wird eine neue group mit einem Element angelegt
		});
	}

	setup(app) {
		this.app = app;
	}
}

module.exports = GroupToSingle;
