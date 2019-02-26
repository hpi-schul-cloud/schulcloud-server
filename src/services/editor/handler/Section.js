class Section {
	constructor(options) {
		this.options = options || {};
		this.docs = {};
	}

	// title as docValue ? wenn nicht dann als db model, würde das data handling für find erleichtern
	patch(sectionId, { docValue, note, visible }, params) {
		return Promise.resolve({
			sectionId,
		});
	}

	create(data, params) {
		// take current user
		// create group

		return Promise.resolve({
			_id: '123',
			lesson: '123',
			owner: '123',
			parent: null,
			permissions: [],
			state: {},
			flag: 'isTemplate',
		});
	}

	get(sectionId, params) {
		return Promise.resolve({
			sectionId,
			// complet data
		});
	}

	// if it is needed
	find(params) {
		// query all for users
		// query all

		return Promise.resolve({
			data: [
				{
					_id: '123',
					name: 'bla',
				},
			],
		});
	}

	remove(sectionId, params) {
		return Promise.resolve({
			sectionId,
		});
	}

	setup(app) {
		this.app = app;
	}
}

module.exports = Section;
