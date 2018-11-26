const errors = require('feathers-errors');
const parse = require('csv-parse/lib/sync');
const Syncer = require('./Syncer');

/**
 * Implements importing CSV documents based on the Syncer interface
 * @class CSVSyncer
 * @implements {Syncer}
 */
class CSVSyncer extends Syncer {

	constructor(app, stats, school, roles, csvData) {
		super(app, stats);
		this.school = school;
		this.roles = roles;
		this.csvData = csvData;
		Object.assign(this.stats, {
			users: {
				successful: 0,
				failed: 0,
			},
		});
	}

	/**
	 * @see {Syncer#respondsTo}
	 */
	static respondsTo(target) {
		return target === 'csv';
	}

	/**
	 * @see {Syncer#params}
	 */
	static params(params, data) {
		if (params && params.school && params.roles && data) {
			return [
				params.school,
				params.roles,
				data
			];
		}
		return false;
	}

	/**
	 * @see {Syncer#steps}
	 */
	steps() {
		return super.steps()
			.then(() => this.parseCsvData())
			.then(records => this.enrichUserData(records))
			.then(users => this.createUsers(users))
			.then(() => this.stats);
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

	enrichUserData(records) {
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
		return this.app.service('registrationlink').create(params);
	}

	createUsers(enrichedUserData) {
		const jobs = enrichedUserData.map(async data => {
			let user = data.user;
			user.importHash = data.linkData.hash;
			user.shortLink = data.linkData.shortLink;
			const success = await this.createUser(user);
			if (success) {
				this.stats.users.successful += 1;
			} else {
				this.stats.users.failed += 1;
			}
		});
		return Promise.all(jobs);
	}

	createUser() {
		return Promise.resolve();
	}
}

module.exports = CSVSyncer;
