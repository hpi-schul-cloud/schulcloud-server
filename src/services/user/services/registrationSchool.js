const { BadRequest, GeneralError } = require('@feathersjs/errors');



class RegistrationSchoolService {
	constructor() {
		this.docs = {};
	}


	/* persönlicher einladungslink + schul id:
	http://localhost:3100/registration/0000d186816abba584714c5f?importHash=...&link=3RZXH
	allgemeiner schülereinladungslink + schul id:
	https://staging.schul-cloud.org/registration/00001006816abba584714c5f?link=axG5z
	allgemeine lehrereinladung + schul id:
	https://staging.schul-cloud.org/registration/00001006816abba584714c5f/byemployee?importHash=...&link=ZrkQy
	klasseneinladung + klassen id:
	https://staging.schul-cloud.org/registration/5cd017c6855a6700155e45b3?link=g2HaA
	experteneinladung + team id:
	https://staging.schul-cloud.org/registration/598e10068e4e364ec18ff46d/byexpert/?importHash=...&link=CMouh
 	*/

	async getExpertSchoolId() {
		if (!this.expertSchoolId) {
			try {
				this.expertSchoolId = await this.app.service('schools').find({ query: { purpose: 'expert' } })
					.then(schools => schools.data[0]._id);
			} catch (err) {
				throw new GeneralError('Experte: Fehler beim Abfragen der Expertenschule.', err);
			}
		}
		return this.expertSchoolId;
	}

	async get(id, params) {
		const promises = [
			this.app.service('schools').get(id).catch(() => undefined),
			this.app.service('classes').get(id).catch(() => undefined),
			this.app.service('teams').get(id).catch(() => undefined),
		];
		const [schoolResponse, classResponse, teamResponse] = await Promise.all(promises);
		let response = schoolResponse;
		if (classResponse) response = this.app.service('schools').get(classResponse.schoolId);
		if (teamResponse) {
			const expertSchoolId = await this.getExpertSchoolId();
			response = this.app.service('schools').get(expertSchoolId);
		}
		return response;
	}

	async setup(app) {
		this.app = app;

	}
}

module.exports = RegistrationSchoolService;
