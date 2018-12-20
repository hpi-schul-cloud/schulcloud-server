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

	constructor(app, stats={}, school, role='student', sendEmails, csvData, params) {
		super(app, stats);
		this.schoolId = school;
		this.role = role;
		this.sendEmails = sendEmails;
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
			classes: {
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
	static params(params, data={}) {
		const query = (params || {}).query || {};
		if (query.school && query.role && data.data) {
			return [
				query.school,
				query.role,
				query.sendEmails === 'true',
				data.data,
				params,
			];
		}
		return false;
	}

	/**
	 * @see {Syncer#steps}
	 */
	steps() {
		return super.steps()
			.then(async () => {
				const records = this.parseCsvData();
				const users = await this.enrichUserData(records);
				const userObjects = await this.createUsers(users);
				if (this.importClasses) await this.createClasses(users, userObjects);
				if (this.sendEmails) await this.emailUsers(users);
				return this.stats;
			});
	}

	parseCsvData() {
		const records = parse(this.csvData, {
			columns: true,
			delimiter: ','
		});
		if (!Array.isArray(records) || records.length === 0) {
			this.logError('Parsing failed: No input data.');
			throw new Error('No input data');
		}
		// validate required params:
		['firstName', 'lastName', 'email'].forEach(param => {
			if (!records[0][param]) {
				throw new Error(`Parsing failed. Expected attribute "${param}"`);
			}
		});
		// validate optional params:
		if (records[0].class !== undefined) {
			this.importClasses = true;
		}
		return records;
	}

	enrichUserData(records) {
		return Promise.all(records.map(async (user) => {
			let linkData = await this.generateRegistrationLink({
				role: this.role,
				schoolId: this.schoolId,
				save: true,
				toHash: user.email
			});
			user = Object.assign(user, {
				schoolId: this.schoolId,
				roles: [this.role],
				sendRegistration: true,
			});
			user.importHash = linkData.hash;
			user.shortLink = linkData.shortLink;
			return user;
		}));
	}

	generateRegistrationLink(params) {
		return this.app.service('registrationlink').create(params);
	}

	async createUsers(users) {
		const createdUsers = await Promise.all(users.map(async user => {
			try {
				const userObject = await this.createUser(user, {lean: true});
				this.stats.users.successful += 1;
				return userObject;
			} catch (err) {
				this.logError('Cannot create user', user, JSON.stringify(err));
				this.stats.users.failed += 1;
				return FAILED_USER;
			}
		}));
		return createdUsers.filter(user => user !== FAILED_USER);
	}

	createUser(user) {
		return this.app.service('users').create(user, this.requestParams);
	}

	async emailUsers(users) {
		return await Promise.all(users.map(async user => {
			try {
				if (user && user.email && user.schoolId && user.shortLink) {
					await this.app.service('mails').create({
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
					});
					this.stats.invitations.successful += 1;
				} else {
					throw new Error('Invalid user object');
				}
			} catch (err) {
				this.stats.invitations.failed += 1;
				this.logError('Cannot send invitation link to user', err);
			}
		}));
	}

	async createClasses(records, users) {
		const classes = this.extractClassesToBeCreated(records);
		const userByEmail = this.byEmail(users);
		const classMapping = await this.buildClassMapping(classes);
		const collection = this.role === 'teacher' ? 'teacherIds' : 'userIds';
		records.forEach(record => {
			const user = userByEmail[record.email];
			if (user === undefined) return;
			const classes = this.splitClasses(record.class);
			classes.forEach(klass => {
				const classObject = classMapping[klass];
				if (classObject === undefined) return;
				classObject[collection].push(user._id);
			});
		});

		for (let key of Object.keys(classMapping)) {
			const classObject = classMapping[key];
			// convert Mongoose array to vanilla JS array to keep the sanitize hook happy:
			const importIds = classObject[collection].map(u => u);
			const patchData = {};
			patchData[collection] = importIds;
			await this.app.service('/classes').patch(classObject._id, patchData);
		}
	}

	extractClassesToBeCreated(records) {
		return records.reduce((list, record) => {
			const classes = this.splitClasses(record.class);
			for (let klass of classes) {
				if (klass !== '' && !list.includes(klass)) {
					list.push(klass);
				}
			}
			return list;
		}, []);
	}

	splitClasses(classes) {
		return classes.split('+');
	}

	byEmail(users) {
		return users.reduce((dict, user) => {
			dict[user.email] = user;
			return dict;
		}, {});
	}

	async getClassObject(klass) {
		const formats = [
			{
				regex: /^(?:0)*((?:1[0-3])|[1-9])(?:\D.*)$/,
				values: async string => {
					const gradeLevelName = string.match(/^(?:0)*((?:1[0-3])|[1-9])(?:\D.*)$/)[1];
					const gradeLevel = await this.findGradeLevel({
						name: gradeLevelName
					});
					return {
						nameFormat: 'gradeLevel+name',
						name: string.match(/^(?:0)*(?:(?:1[0-3])|[1-9])(\D.*)$/)[1],
						gradeLevel,
					};
				},
			},
			{
				regex: /(.*)/,
				values: string => {
					return {
						nameFormat: 'static',
						name: string,
					};
				},
			},
		];
		for (let format of formats) {
			if (format.regex.test(klass)) {
				return Object.assign(await format.values(klass), {
					schoolId: this.schoolId
				});
			}
		}
		throw new Error('Class name does not match any format:', klass);
	}

	async findOrCreateClass(classObject) {
		const existing = await this.app.service('/classes').find({
			query: classObject,
			paginate: false,
			lean: true,
		});
		if (existing.length === 0) {
			return await this.app.service('/classes').create(classObject);
		}
		return existing[0];
	}

	async findGradeLevel(query) {
		const existing = await this.app.service('/gradeLevels').find({
			query,
			paginate: false,
			lean: true,
		});
		if (existing.length >= 0) {
			return existing[0];
		}
		throw new Error('Invalid grade level');
	}

	async buildClassMapping(classes) {
		const classMapping = {};
		await Promise.all(classes.map(async klass => {
			try {
				const classObject = await this.getClassObject(klass);
				classMapping[klass] = await this.findOrCreateClass(classObject);
				this.stats.classes.successful += 1;
			} catch (err) {
				this.stats.classes.failed += 1;
				this.logError('Failed to create class', klass, err);
			}
			return Promise.resolve();
		}));
		return classMapping;
	}
}

module.exports = CSVSyncer;
