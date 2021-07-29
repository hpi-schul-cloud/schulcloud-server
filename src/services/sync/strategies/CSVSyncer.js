const { parse } = require('papaparse');
const stripBOM = require('strip-bom');
const { mix } = require('mixwith');
const { Forbidden } = require('@feathersjs/errors');
const { Configuration } = require('@hpi-schul-cloud/commons');

const Syncer = require('./Syncer');
const ClassImporter = require('./mixins/ClassImporter');
const { SC_TITLE, SC_SHORT_TITLE } = require('../../../../config/globals');
const { equal } = require('../../../helper/compare').ObjectId;

const ATTRIBUTES = [
	{ name: 'namePrefix', aliases: ['nameprefix', 'prefix', 'title', 'affix'] },
	{ name: 'firstName', required: true, aliases: ['firstname', 'first', 'first-name', 'fn'] },
	{ name: 'middleName', aliases: ['middlename', 'middle'] },
	{ name: 'lastName', required: true, aliases: ['lastname', 'last', 'last-name', 'n'] },
	{ name: 'nameSuffix', aliases: ['namesuffix', 'suffix'] },
	{ name: 'email', required: true, aliases: ['email', 'mail', 'e-mail'] },
	{ name: 'class', aliases: ['class', 'classes'] },
	{ name: 'birthday', aliases: ['birthday', 'birth date', 'birthdate', 'birth', 'geburtstag', 'geburtsdatum'] },
];

/**
 * Returns a function that transforms objects of the source schema to the target schema
 * @param {Object} sourceSchema Object representing the source schema
 * @param {Array<Object>} targetSchema Target schema as array of attribute properties
 * `[{name: String, aliases: Array<String>}, ...]`
 * @example
 * const mf = buildMappingFunction({foo: 'bar'}, {name: 'test', aliases: ['foo', 'baz']});
 * mf({foo: 'bar'}) === {test: 'bar'} // true
 * mf({foo: 'hello'}) === {test: 'hello'} // true
 * mf({baz: 42}) === {} // baz is an alias of test, but is not in the source schema
 */
const buildMappingFunction = (sourceSchema, targetSchema = ATTRIBUTES) => {
	const mapping = {};
	Object.keys(sourceSchema).forEach((key) => {
		const attribute = targetSchema.find((a) => a.aliases.includes(key.toLowerCase().trim()));
		if (attribute !== undefined) {
			mapping[key] = attribute.name;
		}
	});
	return (record) =>
		Object.keys(mapping).reduce((res, key) => {
			res[mapping[key]] = record[key];
			return res;
		}, {});
};

/**
 * Implements importing CSV documents based on the Syncer interface
 * @class CSVSyncer
 * @implements {Syncer}
 */
class CSVSyncer extends mix(Syncer).with(ClassImporter) {
	constructor(app, stats = {}, logger, options = {}, requestParams = {}) {
		super(app, stats, logger);

		this.options = options;
		this.requestParams = {
			...requestParams,
			headers: {
				'x-api-key': Configuration.get('CLIENT_API_KEY'),
			},
			authenticated: false,
		};
		Object.assign(this.stats, {
			users: {
				successful: 0,
				created: 0,
				updated: 0,
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
	static params(params, data = {}) {
		const query = (params || {}).query || {};
		if (query.school && data.data) {
			return [
				{
					// required
					schoolId: query.school,
					csvData: data.data,
					// optional
					role: query.role || 'student',
					sendEmails: query.sendEmails === 'true',
					schoolYear: query.schoolYear,
				},
				params,
			];
		}
		return false;
	}

	/**
	 * @see {Syncer#steps}
	 */
	async steps() {
		await super.steps();
		this.options.schoolYear = await this.determineSchoolYear();
		const records = this.parseCsvData();
		const sanitizedRecords = this.sanitizeRecords(records);
		const importClasses = CSVSyncer.needsToImportClasses(sanitizedRecords);
		const clusteredRecords = this.clusterByEmail(sanitizedRecords);

		const actions = Object.values(clusteredRecords).map((record) => async () => {
			try {
				const enrichedRecord = await this.enrichUserData(record);
				const [user, isUserCreated] = await this.createOrUpdateUser(enrichedRecord, this.options.schoolId);
				if (importClasses) {
					const isNewClassAssigned = await this.createClasses(enrichedRecord, user);
					if (!isUserCreated && isNewClassAssigned) this.stats.users.updated += 1;
				}
			} catch (err) {
				this.logError('Cannot create user', record, JSON.stringify(err));
				this.handleUserError(err, record);
			}
		});
		while (actions.length > 0) {
			const action = actions.shift();
			await action.apply(this);
		}

		return this.stats;
	}

	async determineSchoolYear() {
		try {
			if (this.options.schoolYear) {
				return this.app.service('years').get(this.options.schoolYear);
			}
			const school = await this.app.service('schools').get(this.options.schoolId);
			return this.app.service('years').get(school.currentYear);
		} catch (err) {
			this.logError('Cannot determine school year to import from params', {
				paramSchoolYear: this.options.schoolYear,
				paramSchool: this.options.school,
			});
		}
		return undefined;
	}

	parseCsvData() {
		let records = [];
		try {
			const strippedData = stripBOM(this.options.csvData);
			const parseResult = parse(strippedData, {
				delimiter: '', // auto-detect
				newline: '', // auto-detect
				header: true,
				skipEmptyLines: true,
				fastMode: true,
			});
			const { errors } = parseResult;
			if (Array.isArray(errors) && errors.length > 0) {
				errors.forEach((error) => {
					this.logWarning('Skipping line, because it contains an error', { error });
					this.stats.errors.push({
						type: 'file',
						entity: 'Eingabedatei fehlerhaft',
						message: `Syntaxfehler in Zeile ${error.row}`,
					});
					this.stats.users.failed += 1;
				});
			}
			records = parseResult.data;
		} catch (error) {
			this.stats.errors.push({
				type: 'file',
				entity: 'Eingabedatei fehlerhaft',
				message: 'Datei ist nicht im korrekten Format',
			});
			throw error;
		}

		if (!Array.isArray(records) || records.length === 0) {
			this.logError('Parsing failed: No input data.');
			this.stats.errors.push({
				type: 'file',
				entity: 'Eingabedatei fehlerhaft',
				message: 'Datei enthält keine Daten',
			});
			throw new Error('No input data');
		}

		ATTRIBUTES.filter((a) => a.required).forEach((attr) => {
			const attributeIsUsed = Object.keys(records[0]).some((k) => attr.aliases.includes(k.toLowerCase().trim()));
			if (!attributeIsUsed) {
				this.stats.errors.push({
					type: 'file',
					entity: 'Eingabedatei fehlerhaft',
					message: `benötigtes Attribut "${attr.name}" nicht gefunden`,
				});
				throw new Error(`Parsing failed. Expected attribute "${attr.name}"`);
			}
		});
		return records;
	}

	static needsToImportClasses(records) {
		return records[0].class !== undefined;
	}

	sanitizeRecords(records) {
		const requiredAttributes = ATTRIBUTES.filter((a) => a.required).map((a) => a.name);
		const mappingFunction = buildMappingFunction(records[0]);
		const processed = [];
		records.forEach((record) => {
			const mappedRecord = mappingFunction(record);
			if (requiredAttributes.every((attr) => !!mappedRecord[attr])) {
				mappedRecord.email = mappedRecord.email.trim().toLowerCase();
				if (mappedRecord.birthday) {
					if (CSVSyncer.isValidBirthday(mappedRecord.birthday)) {
						mappedRecord.birthday = CSVSyncer.convertToDate(mappedRecord.birthday);
					} else {
						this.logWarning(`Geburtsdatum fehlerhaft: ${record.firstName},${record.lastName},${mappedRecord.birthday}`);
						this.stats.errors.push({
							type: 'user',
							entity: `${record.firstName},${record.lastName},${record.email},${mappedRecord.birthday}`,
							message: 'Geburtsdatum fehlerhaft. Zulässige Formate: dd.mm.yyyy | dd/mm/yyyy | dd-mm-yyyy',
						});
						delete mappedRecord.birthday;
					}
				}
				processed.push(mappedRecord);
			}
			// no else condition or errors necessary, because the error was reported
			// and logged during parsing
		});
		return processed;
	}

	clusterByEmail(records) {
		const recordsByEmail = {};
		records.forEach(async (record) => {
			if (recordsByEmail[record.email]) {
				this.logWarning(`Mehrfachnutzung der E-Mail-Adresse "${record.email}". `);
				this.stats.errors.push({
					type: 'user',
					entity: `${record.firstName},${record.lastName},${record.email}`,
					message:
						`Mehrfachnutzung der E-Mail-Adresse "${record.email}". ` +
						'Nur der erste Eintrag wurde importiert, dieser ignoriert.',
				});
				this.stats.users.failed += 1;
			} else {
				recordsByEmail[record.email] = record;
			}
		});
		return recordsByEmail;
	}

	async enrichUserData(record) {
		const linkData = await this.generateRegistrationLink({
			role: this.options.role,
			schoolId: this.options.schoolId,
			save: true,
			toHash: record.email,
		});
		const enrichedUser = Object.assign(record, {
			schoolId: this.options.schoolId,
			roles: [this.options.role],
		});
		enrichedUser.importHash = linkData.hash;
		enrichedUser.shortLink = linkData.shortLink;
		return enrichedUser;
	}

	async generateRegistrationLink(params) {
		try {
			const registrationLink = await this.app.service('registrationlink').create(params);
			return registrationLink;
		} catch (err) {
			return {
				hash: null,
				shortLink: null,
			};
		}
	}

	async createOrUpdateUser(record, schoolId) {
		const user = await this.findUserForRecord(record);

		if (user === null) {
			return [await this.createUser(record), true];
		}

		if (!equal(user.schoolId, schoolId)) {
			// Give the feedback that the user exist. But can only execute by admins and is an important information.
			throw new Forbidden('User is not on your school.');
		}
		this.stats.users.successful += 1;
		// TODO the already requested user, or createt user, is request it again -> please combine methodes for performance
		return [await this.app.service('users').get(user._id), false];
	}

	async findUserForRecord(record) {
		const users = await this.app.service('users').find(
			{
				query: {
					email: record.email,
					$populate: 'roles',
					$select: ['_id', 'roles', 'schoolId'],
				},
				paginate: false,
				lean: true,
			},
			// x-api-key is override user scope permissions please carful at this point
			this.requestParams
		);
		if (users.length >= 1) {
			const existingUser = users[0];
			if (record.roles && !existingUser.roles.some((r) => r.name === record.roles[0])) {
				throw new Error('Cannot change user roles.');
			}
			return existingUser;
		}
		return null;
	}

	async createUser(record) {
		const userObject = await this.app.service('users').create(record, this.requestParams);
		if (this.options.sendEmails) {
			await this.emailUser(record);
		}
		this.stats.users.created += 1;
		this.stats.users.successful += 1;
		return userObject;
	}

	handleUserError(err, record) {
		this.stats.users.failed += 1;
		this.logWarning(`Error while importing user: ${record.firstName},${record.lastName},${record.email}`);
		if (err.message.startsWith('user validation failed')) {
			this.stats.errors.push({
				type: 'user',
				entity: `${record.firstName},${record.lastName},${record.email}`,
				message: `Ungültiger Wert in Spalte "${err.message.match(/Path `(.+)` is required/)[1]}"`,
			});
		} else if (err.message.startsWith('Cannot change user role')) {
			this.stats.errors.push({
				type: 'user',
				entity: `${record.firstName},${record.lastName},${record.email}`,
				message: 'Es existiert bereits ein Nutzer mit dieser E-Mail-Adresse, jedoch mit einer anderen Rolle.',
			});
		} else {
			this.stats.errors.push({
				type: 'user',
				entity: `${record.firstName},${record.lastName},${record.email}`,
				message: err.message,
			});
		}
	}

	async emailUser(user) {
		try {
			if (user && user.email && user.schoolId && user.shortLink) {
				await this.app.service('mails').create({
					email: user.email,
					subject: `Einladung für die Nutzung der ${SC_TITLE}!`,
					headers: {},
					content: {
						text:
							`Einladung in die ${SC_TITLE}\n` +
							`Hallo ${user.firstName} ${user.lastName}!\n\n` +
							`Du wurdest eingeladen, der ${SC_TITLE} beizutreten, ` +
							'bitte vervollständige deine Registrierung unter folgendem Link: ' +
							`${user.shortLink}\n\n` +
							'Viel Spaß und einen guten Start wünscht dir dein ' +
							`${SC_SHORT_TITLE}-Team`,
					},
				});
				this.stats.invitations.successful += 1;
			} else {
				throw new Error('Invalid user object');
			}
		} catch (err) {
			this.stats.invitations.failed += 1;
			this.stats.errors.push({
				type: 'invitation',
				entity: user.email,
				message: 'Die automatische Einladungs-E-Mail konnte nicht gesendet werden. Bitte manuell einladen.',
			});
			this.logError('Cannot send invitation link to user', err);
		}
	}

	async createClasses(record, user) {
		if (user === undefined) return false;
		let newClassAssigned = false;
		const classes = CSVSyncer.splitClasses(record.class);
		const classMapping = await this.buildClassMapping(classes, {
			schoolId: this.options.schoolId,
			year: this.options.schoolYear._id,
		});

		const actions = classes.map(async (klass) => {
			const classObject = classMapping[klass];
			if (classObject === undefined) return;

			const collection = this.options.role === 'teacher' ? 'teacherIds' : 'userIds';
			const importIds = classObject[collection].map((uid) => uid.toString());
			if (!importIds.includes(user._id.toString())) {
				const patchData = {};
				patchData[collection] = [...importIds, user._id.toString()];
				newClassAssigned = true;
				await this.app.service('/classes').patch(classObject._id, patchData);
			}
		});
		await Promise.all(actions);
		return newClassAssigned;
	}

	static splitClasses(classes) {
		return classes.split('+').filter((name) => name !== '');
	}

	/**
	 * Validates a given string is in one of these formats: dd.mm.yyyy, dd/mm/yyyy, dd-mm-yyyy
	 * Also accounts for length of months (and leap days) for years with four digits.
	 * @static
	 * @param {String} dateString
	 * @returns {boolean} true if valid date in one of the defined formats, false otherwise
	 */
	static isValidBirthday(dateString) {
		// Adapted from https://stackoverflow.com/questions/15491894/regex-to-validate-date-format-dd-mm-yyyy
		const dateValidationRegex = new RegExp(
			[
				'^(?:(?:31(\\/|-|\\.)(?:0?[13578]|1[02]))\\1|',
				'(?:(?:29|30)(\\/|-|\\.)(?:0?[13-9]|1[0-2])\\2))(?:(?:1[6-9]|[2-9]\\d)?\\d{2})$|',
				'^(?:29(\\/|-|\\.)0?2\\3(?:(?:(?:1[6-9]|[2-9]\\d)?(?:0[48]|[2468][048]|[13579][26])|',
				'(?:(?:16|[2468][048]|[3579][26])00))))$|',
				'^(?:0?[1-9]|1\\d|2[0-8])(\\/|-|\\.)(?:(?:0?[1-9])|(?:1[0-2]))\\4(?:(?:1[6-9]|[2-9]\\d)?\\d{2})$',
			].join('')
		);
		return dateValidationRegex.test(dateString);
	}

	/**
	 * Converts a string formatted date into a Date object.
	 * Valid date string formats: dd.mm.yyyy, dd/mm/yyyy, dd-mm-yyyy
	 * @static
	 * @see CSVSyncer.isValidBirthday for validation
	 * @param {String} dateString String in the format dd(.|/|-)mm(.|/|-)yyyy
	 * @returns {Date} the corresponding Date object
	 */
	static convertToDate(dateString) {
		const dd = parseInt(dateString.substring(0, 2), 10);
		const mm = parseInt(dateString.substring(3, 5), 10);
		const yyyy = parseInt(dateString.substring(6, 10), 10);

		const date = new Date(yyyy, mm - 1, dd);
		return date;
	}
}

module.exports = CSVSyncer;
