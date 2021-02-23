const { NotFound, GeneralError } = require('../../../errors');

/**
 * Service to find a school belonging an id of unknown type, like from a registration link.
 * supports school, class, and teamIds.
 */
class RegistrationSchoolService {
	constructor() {
		this.docs = {};
	}

	/**
	 * singleton expertSchoolId
	 */
	async getExpertSchoolId() {
		if (!this.expertSchoolId) {
			try {
				this.expertSchoolId = await this.app
					.service('schools')
					.find({ query: { purpose: 'expert' } })
					.then((schools) => schools.data[0]._id);
			} catch (err) {
				throw new GeneralError('Experte: Fehler beim Abfragen der Expertenschule.', err);
			}
		}
		return this.expertSchoolId;
	}

	/**
	 * returns the school for given Id. For a schoolId it returns the school itself,
	 * for a classId the school the class belongs to, for a teamId the expert school.
	 * @param {ObjectId} id school, class, or team id.
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
			this.app
				.service('teams')
				.get(id)
				.catch(() => undefined),
		];
		const [schoolResponse, classResponse, teamResponse] = await Promise.all(promises);
		let response;
		if (schoolResponse) response = schoolResponse;
		if (classResponse) response = this.app.service('schools').get(classResponse.schoolId);
		if (teamResponse) {
			const expertSchoolId = await this.getExpertSchoolId();
			response = this.app.service('schools').get(expertSchoolId);
		}
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
