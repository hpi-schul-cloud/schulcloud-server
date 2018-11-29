const errors = require('feathers-errors');
const parse = require('csv-parse/lib/sync');
const Syncer = require('./Syncer');

const FAILED_USER = null;

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
			invitations: {
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
			.then(users => this.sendEmails(users))
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
					return Promise.resolve(user);
				})
				.catch(err => {
					this.logError('Cannot create user', user, JSON.stringify(err));
					this.stats.users.failed += 1;
					return Promise.resolve(FAILED_USER);
				});
		});
		return Promise.all(jobs);
	}

	createUser(user) {
		return this.app.service('users').create(user, this.requestParams);
	}

	sendEmails(users) {
		const createdUsers = users.filter(user => user !== FAILED_USER);
		const jobs = createdUsers.map(user => {
			if (user && user.email && user.schoolId && user.shortLink) {
				return this.app.service('mails').create({
					email: user.email,
					subject: `Einladung für die Nutzung der ${process.env.SC_TITLE}!`,
					headers: {},
					content: {
						text: `Einladung in die ${process.env.SC_TITLE}\n`
							+ `Hallo ${user.firstName} ${user.lastName}!\n\n`
							+ `Du wurdest eingeladen, der ${process.env.SC_TITLE} beizutreten, `
							+ 'bitte vervollständige deine Registrierung unter folgendem Link: '
							+ user.shortLink + '\n'
							+ 'Viel Spaß und einen guten Start wünscht dir dein '
							+ `${process.env.SC_SHORT_TITLE}-Team`
					}
				})
				.then(() => {
					this.stats.invitations.successful += 1;
					return Promise.resolve();
				})
				.catch(err => {
					this.stats.invitations.failed += 1;
					this.logError('Cannot send invitation link to user', err);
					return Promise.resolve();
				});
			} else {
				this.stats.invitations.failed += 1;
				this.logError('Invalid user object', user);
				return Promise.resolve();
			}
		});
		return Promise.all(jobs);
	}
}

module.exports = CSVSyncer;
