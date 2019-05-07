class SubSection {
	constructor(options) {
		this.options = options || {};
		// this.docs = {};
	}

	create({ groups, templateId }, params) {
		return Promise.resolve({
			// für jedes element in groups wird ein sub document angelegt von templateId
			// mit permissionSchema as write mode, wie mappen? wer ist owner ?
		});
	}

	setup(app) {
		this.app = app;
	}
}

module.exports = SubSection;
