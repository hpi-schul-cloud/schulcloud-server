const { NotFound, GeneralError } = require('../../../errors');

/**
 * Service to find a school belonging an id of unknown type, like from a registration link.
 * supports school and class IDs.
 */
class RegistrationSchoolService {
	constructor() {
		this.docs = {};
	}

	/**
	 * singleton expertSchoolId
	 */
	async getExternalPersonSchoolId() {
		if (!this.expertSchoolId) {
			try {
				this.expertSchoolId = await this.app
					.service('schools')
					.find({ query: { purpose: 'external_person_school' } })
					.then((schools) => schools.data[0]._id);
			} catch (err) {
				throw new GeneralError('Experte: Fehler beim Abfragen der Expertenschule.', err);
			}
		}
		return this.expertSchoolId;
	}

	/**
	 * returns the school for given Id. For a schoolId it returns the school itself,
	 * for a classId the school the class belongs to.
	 * @param {ObjectId} id school or class id.
	 * @param {Object} params reserved for future use.
	 */
	async get(id, params) {
		const promises = [
			this.app
				.service('schools')
				.get(id)
				.catch(() => undefined),
			this.app
				.service('classes')
				.get(id)
				.catch(() => undefined),
		];
		const [schoolResponse, classResponse] = await Promise.all(promises);
		let response;
		if (schoolResponse) response = schoolResponse;
		if (classResponse) response = this.app.service('schools').get(classResponse.schoolId);
		if (!response) {
			throw new NotFound('Id not found.');
		}
		return response;
	}

	async setup(app) {
		this.app = app;
	}
}

module.exports = RegistrationSchoolService;
