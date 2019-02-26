class GroupToSingle {
	constructor(options) {
		this.options = options || {};
		this.docs = {};
	}

	static create({ group }, params) {
		return {
			// für jedes element in group wird eine neue group mit einem Element angelegt
		};
	}

	setup(app) {
		this.app = app;
	}
}

module.exports = GroupToSingle;
