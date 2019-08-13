const { BadRequest } = require('@feathersjs/errors');

// private functions

class ClassSuccessorService {
	constructor() {
		this.docs = {};
	}

	/**
	 * returns suggested data for a successor class in the next year, based on a given class.
	 * The Successor class is NOT created!
	 * @param {ObjectId} id classId
	 * @param {Object} params params object
	 */
	async get(id, params) {
		try {
			const currentClass = await this.app.service('classes').get(id);
			const successor = {
				name: currentClass.name,
			};
			return { successor };
		} catch (err) {
			throw err;
		}
	}

	async find(params) {
		try {
			return [params];
		} catch (err) {
			throw err;
		}
	}

	setup(app) {
		this.app = app;
	}
}

module.exports = ClassSuccessorService;
