class Section {
	constructor(options) {
		this.options = options || {};
		this.docs = {};
	}

	// title as docValue ? wenn nicht dann als db model, würde das data handling für find erleichtern
	static patch(sectionId, { docValue, note, visible }, params) {
		return {
			sectionId,
		};
	}

	static create(data, params) {
		// take current user
		// create group

		return {
			_id: '123',
			lesson: '123',
			owner: '123',
			parent: null,
			permissions: [],
			state: {},
			flag: 'isTemplate',
		};
	}

	static get(sectionId, params) {
		return {
			sectionId,
			// complet data
		};
	}

	// if it is needed
	static find(params) {
		// query all for users
		// query all

		return {
			data: [
				{
					_id: '123',
					name: 'bla',
				},
			],
		};
	}

	static remove(sectionId, params) {
		return {
			sectionId,
		};
	}

	setup(app) {
		this.app = app;
	}
}

module.exports = Section;
