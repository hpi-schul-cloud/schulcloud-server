const errors = require('feathers-errors');
const parse = require('csv-parse/lib/sync');
const Syncer = require('./Syncer');

/**
 * Implements importing CSV documents based on the Syncer interface
 * @class CSVSyncer
 * @implements {Syncer}
 */
class CSVSyncer extends Syncer {

	constructor(app, stats, school, roles, csvData, params) {
		super(app, stats);
		this.schoolId = school;
		this.roles = roles;
		this.csvData = csvData;
		this.requestParams = params;
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
		const query = (params || {}).query || {};
		if (query.school && query.roles && data) {
			return [
				query.school,
				query.roles,
				data,
				params
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
			schoolId: this.schoolId,
			roles: this.roles,
			sendRegistration: true,
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
		const jobs = enrichedUserData.map(data => {
			let user = data.user;
			user.importHash = data.linkData.hash;
			user.shortLink = data.linkData.shortLink;
			return this.createUser(user)
				.then(() => {
					this.stats.users.successful += 1;
					return Promise.resolve();
				})
				.catch(err => {
					this.logError('Cannot create user', user, JSON.stringify(err));
					this.stats.users.failed += 1;
					return Promise.resolve();
				});
		});
		return Promise.all(jobs);
	}

	createUser(user) {
		return this.app.service('users').create(user, this.requestParams);
	}
}

module.exports = CSVSyncer;
