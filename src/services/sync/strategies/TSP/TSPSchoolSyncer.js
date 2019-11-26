const { BadRequest } = require('@feathersjs/errors');
const { mix } = require('mixwith');

const Syncer = require('../Syncer');
const ClassImporter = require('../mixins/ClassImporter');

const {
	TspApi,
	ENTITY_SOURCE, SOURCE_ID_ATTRIBUTE,
	getUsername, getEmail,
} = require('./TSP');
const SchoolYearFacade = require('../../../school/logic/year');
const accountModel = require('../../../account/model');

const SYNCER_TARGET = 'tsp-school';

/**
 * Used to sync one or more schools from the TSP to the Schul-Cloud instance.
 * Configs can either be created manually or using TSPBaseSyncer.
 * @see TSPBaseSyncer
 * @extends Syncer
 * @mixes ClassImporter
 */
class TSPSchoolSyncer extends mix(Syncer).with(ClassImporter) {
	/**
	 * @extends Syncer#respondsTo
	 */
	static respondsTo(target) {
		return target === SYNCER_TARGET;
	}

	/**
	 * Validates the params given to the Syncer.
	 * `params.query` or `data` should contain a config object with at least:
	 * `{ baseUrl: 'https://foo.bar/baz', clientId: 'some client id' }`
	 * @extends Syncer#params
	 */
	static params(params, data) {
		const config = ((params || {}).query || {}).config || (data || {}).config;
		if (!config) {
			throw new BadRequest('Missing parameter "config".');
		}
		if (!config.baseUrl) {
			throw new BadRequest('Missing parameter "config.baseUrl" (URL that points to the TSP Server).');
		}
		if (!config.clientId) {
			throw new BadRequest('Missing parameter "config.clientId" (clientId to be used for TSP requests)');
		}
		return [config];
	}

	/**
	 * Creates an instance of TSPSchoolSyncer.
	 * @param {Object} config see #params
	 * @extends Syncer#constructor
	 */
	constructor(app, stats, logger, config) {
		super(app, stats, logger);
		this.stats = Object.assign(this.stats, {
			users: {
				teachers: { created: 0, updated: 0, errors: 0 },
				students: { created: 0, updated: 0, errors: 0 },
			},
			classes: { created: 0, updated: 0, errors: 0 },
		});
		this.config = config;
		this.api = new TspApi(config);

		// caches for currentYear and federalState as they need async initialization
		this.currentYear = undefined;
		this.federalState = undefined;
	}

	/**
	 * Does the following steps:
	 *   * find all login systems associated with the given config
	 *   * fetch all TSP teachers, students, and classes; group by school identifier
	 *   * for every school:
	 *     * create it if it does not yet exist
	 *     * create teachers
	 *     * create students; store references grouped by class
	 *     * create classes
	 * @returns {Object} stats (see #constructor)
	 * @async
	 * @extends Syncer#steps
	 */
	async steps() {
		let [teacherMap, studentMap, classMap] = [[], [], []];

		this.logInfo('Looking for configuration...');
		const systems = await this.findSystems();
		this.logInfo(`${systems.length} configs found.`);
		if (systems.length > 0) {
			this.logInfo('Requesting and grouping entities. This can take a while...');
			// fetch entities in parallel and create a mapping (schoolIdentifier => list<Entity>)
			[teacherMap, studentMap, classMap] = await Promise.all(['teachers', 'students', 'classes']
				.map((type) => this.fetch(type).then(this.createSchoolMap)));
			this.logInfo('Done.');
		}

		for (const system of systems) {
			this.logInfo(`Syncing ${system.alias}...`);
			let school = await this.findSchool(system);
			if (!school) {
				this.logInfo(`No school found for system "${system.alias}" (${system._id}).`, system);
				school = await this.createSchool(system);
			}

			// find all teachers/students/classes of this school
			const schoolTeachers = teacherMap[(system.tsp || {}).identifier] || [];
			const schoolStudents = studentMap[(system.tsp || {}).identifier] || [];
			const schoolClasses = classMap[(system.tsp || {}).identifier] || [];
			this.logInfo(`School has ${schoolTeachers.length} teachers, ${schoolStudents.length} students`
				+ `, and ${schoolClasses.length} classes.`);

			const teacherMapping = {};
			const classMapping = {};

			this.logInfo('Syncing teachers...');
			// create teachers and add them to the mapping (teacherUID => User)
			await Promise.all(schoolTeachers.map(async (tspTeacher) => {
				const teacher = await this.createOrUpdateTeacher(tspTeacher, school, system, classMapping);
				teacherMapping[tspTeacher.lehrerUid] = teacher;
			}));

			this.logInfo('Syncing students...');
			// create students and add them to the mapping (classUid => [User])
			await Promise.all(schoolStudents.map(async (tspStudent) => {
				const student = await this.createOrUpdateStudent(tspStudent, school, system, classMapping);
				classMapping[tspStudent.klasseId] = classMapping[tspStudent.klasseId] || [];
				classMapping[tspStudent.klasseId].push(student._id);
			}));

			this.logInfo('Syncing classes...');
			// create classes based on API response and user mappings
			await this.createOrUpdateClasses(schoolClasses, school, teacherMapping, classMapping);

			this.logInfo('Done.');
		}
		this.logInfo('Done.');
	}

	/**
	 * For a list of entities, returns a map (schoolIdentifier => [Entity])
	 * which contains a list of entities for each schoolIdentifier
	 * @param {Array} list list of TSP entities
	 * @returns {Object} map (schoolIdentifier => [Entity])
	 */
	createSchoolMap(list) {
		const globalMap = {};
		list.forEach((item) => {
			const k = String(item.schuleNummer);
			globalMap[k] = globalMap[k] || [];
			globalMap[k].push(item);
		});
		return globalMap;
	}

	/**
	 * Creates a school based on a TSP login system
	 * @param {System} system
	 * @returns {School} School
	 * @async
	 */
	async createSchool(system) {
		return this.app.service('schools').create({
			name: system.tsp.schoolName,
			systems: [system._id],
			currentYear: await this.getCurrentYear(),
			federalState: await this.getFederalState(),
		});
	}

	// async getters do not exist, so this will have to do
	async getCurrentYear() {
		if (!this.currentYear) {
			const years = await this.app.service('years').find();
			if (years.total === 0) {
				throw new Error('At least one year has to exist in the database.');
			}
			this.currentYear = new SchoolYearFacade(years.data).defaultYear;
		}
		return this.currentYear;
	}

	// async getters do not exist, so this will have to do
	async getFederalState() {
		if (!this.federalState) {
			const states = await this.app.service('federalStates').find({ query: { abbreviation: 'TH' } });
			if (states.total === 0) {
				throw new Error('The federal state does not exist.');
			}
			this.federalState = states.data[0]._id;
		}
		return this.federalState;
	}

	/**
	 * Returns all login systems compatible with the provided config.
	 * Optionally filters by schoolIdentifier if set as `config.schoolIdentifier`.
	 * @returns {Array<System>} list of systems
	 * @async
	 */
	async findSystems() {
		if (this.config.systemId) {
			const system = await this.app.service('systems').get(this.config.systemId);
			this.config.schoolIdentifier = (system.tsp || {}).identifier;
			return [system];
		}
		const query = {
			type: SYNCER_TARGET,
		};
		if (this.config.schoolIdentifier) {
			query['tsp.identifier'] = this.config.schoolIdentifier;
		}
		return this.app.service('systems').find({
			query,
			paginate: false,
		});
	}

	/**
	 * Returns the school associated with the given login system
	 * @param {System} system
	 * @returns {School|null} the school or null if it does not exist
	 * @async
	 */
	async findSchool(system) {
		const response = await this.app.service('schools').find({
			query: {
				systems: system._id,
				$limit: 1,
			},
		});
		if (!Array.isArray(response.data) || response.total < 1) {
			return null;
		}
		return response.data[0];
	}

	/**
	 * Fetches an entity type from the TSP API.
	 * @param {String} type one of [`teachers`, `students`, `classes`]
	 * @returns {Array} API response (Array<Entity>)
	 * @async
	 */
	async fetch(type) {
		const strings = {
			teachers: { de: 'Lehrer', url: '/tip-ms/api/schulverwaltung_export_lehrer' },
			students: { de: 'Schüler', url: '/tip-ms/api/schulverwaltung_export_schueler' },
			classes: { de: 'Klassen', url: '/tip-ms/api/schulverwaltung_export_klasse' },
		};
		let result = [];
		try {
			result = await this.api.request(strings[type].url);
		} catch (err) {
			this.logError(`Cannot fetch ${type}.`, err);
			// generate a nice user-facing error
			this.stats.errors.push({
				type: `fetch-${type}`,
				message: `Es ist derzeit nicht möglich ${strings[type].de}daten aus dem TSP zu aktualisieren.`,
			});
		}
		return result;
	}

	/**
	 * Creates or updates a Schul-Cloud user based on a TSP teacher object
	 * @param {Object} tspTeacher TSP teacher object
	 * @param {School} school school of the user
	 * @param {System} system login system (for account creation)
	 * @returns {User} the user object of the SC-Teacher
	 * @async
	 */
	async createOrUpdateTeacher(tspTeacher, school, system) {
		const query = { source: ENTITY_SOURCE };
		query[`sourceOptions.${SOURCE_ID_ATTRIBUTE}`] = tspTeacher.lehrerUid;
		const users = await this.app.service('users').find({ query });
		if (users.total > 0) {
			return this.updateTeacher(users.data[0]._id, tspTeacher);
		}
		return this.createTeacher(tspTeacher, school, system);
	}

	/**
	 * Patches a Schul-Cloud user based on information from a TSP teacher object
	 * @param {ObjectId|String} userId userId
	 * @param {Object} tspTeacher TSP teacher object
	 * @returns {User|null} the patched user or null (on error)
	 * @async
	 */
	async updateTeacher(userId, tspTeacher) {
		try {
			const teacher = await this.app.service('users').patch(
				userId,
				{
					namePrefix: tspTeacher.lehrerTitel,
					firstName: tspTeacher.lehrerVorname,
					lastName: tspTeacher.lehrerNachname,
				},
			);
			this.stats.users.teachers.updated += 1;
			return teacher;
		} catch (err) {
			this.stats.users.teachers.errors += 1;
			this.logError('User update error', err, userId, tspTeacher);
			this.stats.errors.push({
				type: 'update-teacher',
				entity: tspTeacher.lehrerUid,
				message: `Lehrer "${tspTeacher.lehrerVorname} ${tspTeacher.lehrerNachname}"`
					+ ' konnte nicht aktualisiert werden.',
			});
			return null;
		}
	}

	/**
	 * Create a Schul-Cloud user based on a TSP teacher object
	 * @param {Object} tspTeacher TSP teacher object
	 * @param {School} school the user's school
	 * @param {System} system the login system used for account creation
	 * @returns {User|null} the user or null (on error)
	 * @async
	 */
	async createTeacher(tspTeacher, school, system) {
		try {
			const sourceOptions = {};
			sourceOptions[SOURCE_ID_ATTRIBUTE] = tspTeacher.lehrerUid;
			const teacher = await this.createUserAndAccount({
				namePrefix: tspTeacher.lehrerTitel,
				firstName: tspTeacher.lehrerVorname,
				lastName: tspTeacher.lehrerNachname,
				schoolId: school._id,
				source: ENTITY_SOURCE,
				sourceOptions,
			},
			'teacher', system);
			this.stats.users.teachers.created += 1;
			return teacher;
		} catch (err) {
			this.stats.users.teachers.errors += 1;
			this.logError('User creation error', err, tspTeacher);
			this.stats.errors.push({
				type: 'create-teacher',
				entity: tspTeacher.lehrerUid,
				message: `Lehrer "${tspTeacher.lehrerVorname} ${tspTeacher.lehrerNachname}"`
					+ ' konnte nicht erstellt werden.',
			});
			return null;
		}
	}

	/**
	 * Creates or updates a Schul-Cloud user based on a TSP student object
	 * @param {Object} tspStudent TSP student object
	 * @param {School} school school of the user
	 * @param {System} system login system (for account creation)
	 * @returns {User} the user object of the SC-Student
	 * @async
	 */
	async createOrUpdateStudent(tspStudent, school, system) {
		const query = { source: ENTITY_SOURCE };
		query[`sourceOptions.${SOURCE_ID_ATTRIBUTE}`] = tspStudent.schuelerUid;
		const users = await this.app.service('users').find({ query });
		if (users.total !== 0) {
			return this.updateStudent(users.data[0]._id, tspStudent);
		}
		return this.createStudent(tspStudent, school, system);
	}

	/**
	 * Patches a Schul-Cloud user based on information from a TSP student object
	 * @param {ObjectId|String} userId userId
	 * @param {Object} tspStudent TSP student object
	 * @returns {User|null} the patched user or null (on error)
	 * @async
	 */
	async updateStudent(userId, tspStudent) {
		try {
			const student = await this.app.service('users').patch(
				userId,
				{
					firstName: tspStudent.schuelerVorname,
					lastName: tspStudent.schuelerNachname,
				},
			);
			this.stats.users.students.updated += 1;
			return student;
		} catch (err) {
			this.stats.users.students.errors += 1;
			this.logError('User update error', err, userId, tspStudent);
			this.stats.errors.push({
				type: 'update-student',
				entity: tspStudent.schuelerUid,
				message: `Schüler "${tspStudent.schuelerVorname} ${tspStudent.schuelerNachname}"`
					+ ' konnte nicht aktualisiert werden.',
			});
			return null;
		}
	}

	/**
	 * Create a Schul-Cloud user based on a TSP student object
	 * @param {Object} tspStudent TSP student object
	 * @param {School} school the user's school
	 * @param {System} system the login system used for account creation
	 * @returns {User|null} the user or null (on error)
	 * @async
	 */
	async createStudent(tspStudent, school, system) {
		try {
			const sourceOptions = {};
			sourceOptions[SOURCE_ID_ATTRIBUTE] = tspStudent.schuelerUid;
			const student = await this.createUserAndAccount({
				firstName: tspStudent.schuelerVorname,
				lastName: tspStudent.schuelerNachname,
				schoolId: school._id,
				source: ENTITY_SOURCE,
				sourceOptions,
			},
			'student', system);
			this.stats.users.students.created += 1;
			return student;
		} catch (err) {
			this.stats.users.students.errors += 1;
			this.logError('User creation error', err, tspStudent);
			this.stats.errors.push({
				type: 'create-student',
				entity: tspStudent.schuelerUid,
				message: `Schüler "${tspStudent.schuelerVorname} ${tspStudent.schuelerNachname}"`
					+ ' konnte nicht erstellt werden.',
			});
			return null;
		}
	}

	/**
	 * Registers a user and creates an account
	 * @param {Object} userOptions options to be provided to the user service
	 * @param {Array<String>} roles the user's roles
	 * @param {System} system the user's login system
	 * @returns {User} the user object
	 * @async
	 */
	async createUserAndAccount(userOptions, roles, system) {
		const username = getUsername(userOptions);
		const email = getEmail(userOptions);
		const { pin } = await this.app.service('registrationPins').create({
			email,
			verified: true,
			silent: true,
		});
		const user = await this.app.service('users').create({
			...userOptions,
			pin,
			email,
			roles,
		});
		await accountModel.create({
			userId: user._id,
			username,
			systemId: system._id,
			activated: true,
		});
		return user;
	}

	/**
	 * Creates classes based on TSP API response
	 * @param {*} classes list of TSP class objects
	 * @param {*} school school
	 * @param {*} teacherMapping a mapping (teacherUid => User)
	 * @param {*} classMapping a mapping (classUid => [User])
	 * @returns {Array<Class>} created classes
	 * @async
	 */
	createOrUpdateClasses(classes, school, teacherMapping, classMapping) {
		return Promise.all(classes.map((klass) => {
			const className = klass.klasseName;
			const sourceOptions = {};
			sourceOptions[SOURCE_ID_ATTRIBUTE] = klass.klasseId;
			const options = {
				schoolId: school._id,
				year: school.currentYear,
				teacherIds: [teacherMapping[klass.lehrerUid]],
				userIds: classMapping[klass.klasseId],
				source: ENTITY_SOURCE,
				sourceOptions,
			};
			return this.findOrCreateClassByName(className, options); // see ClassImporter mixin
		}));
	}
}

module.exports = {
	TSPSchoolSyncer,
	SYNCER_TARGET,
};
