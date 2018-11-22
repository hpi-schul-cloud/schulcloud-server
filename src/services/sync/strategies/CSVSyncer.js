const errors = require('feathers-errors');
const parse = require('csv-parse/lib/sync');
const Syncer = require('./Syncer');

/**
 * Implements importing CSV documents based on the Syncer interface
 * @class CSVSyncer
 * @implements {Syncer}
 */
class CSVSyncer extends Syncer {

	constructor(app, school, roles, csvData) {
		super(app);
		this.school = school;
		this.roles = roles;
		this.csvData = csvData;
	}

	/**
	 * @see {Syncer#steps}
	 */
	steps() {
		return super.steps()
			.then(() => this.parseCsvData())
			.then(records => this.createUserRegistrationLinks(records))
			.then(linkData => this.createUsers(linkData));
	}

	parseCsvData() {
		const records = parse(this.csvData, {
			columns: true,
			delimiter: ','
		});
		if (Object.keys(records[0]).length <= 1) {
			this.logError('Parsing failed: Too few columns in input data.');
			throw new Error('CSVSyncer: parsing failed');
		}
		return Promise.resolve(records);
	}

	createUserRegistrationLinks(records) {
		const groupData = {
			schoolId: this.school._id,
			roles: this.roles,
		};
		const recordPromises = records.map(async (user) => {
			user = Object.assign(user, groupData);
			let linkData = await this.generateRegistrationLink({
				role: this.roles[0],
				save: true,
				toHash: user.email
			});
			return { user, linkData };
		});
		return Promise.all(recordPromises);
	}

	generateRegistrationLink(params) {
		return this.app.service('registrationLink').create(params);
	}

	createUsers(linkData) {
		return Promise.resolve();
	}
}

module.exports = CSVSyncer;
