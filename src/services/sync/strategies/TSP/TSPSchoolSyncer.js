const { mix } = require('mixwith');

const Syncer = require('../Syncer');
const ClassImporter = require('../mixins/ClassImporter');
const { equal: sameObjectId } = require('../../../../helper/compare').ObjectId;

const { TspApi, config: TSP_CONFIG, ENTITY_SOURCE, SOURCE_ID_ATTRIBUTE, createUserAndAccount } = require('./TSP');

const { switchSchool, getInvalidatedUuid } = require('./SchoolChange');

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
		return target === SYNCER_TARGET && TSP_CONFIG.FEATURE_ENABLED;
	}

	/**
	 * Validates the params given to the Syncer.
	 * `params.query` or `data` can optionally contain a config object with:
	 * `{
	 * 		schoolIdentifier: '4738' // a TSP school id (filter)
	 * 		lastChange: 159274672 // Unix timestamp to be relayed to the TSP API as lastChange
	 * 	}`
	 * @extends Syncer#params
	 */
	static params(params, data) {
		const config = ((params || {}).query || {}).config || (data || {}).config;
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
				teachers: {
					unchanged: 0,
					created: 0,
					updated: 0,
					errors: 0,
				},
				students: {
					unchanged: 0,
					created: 0,
					updated: 0,
					errors: 0,
				},
			},
		});
		this.config = this.normalizeConfig(config);

		this.api = new TspApi();

		// caches for currentYear and federalState as they need async initialization
		this.currentYear = undefined;
		this.federalState = undefined;
	}

	/**
	 * Ensures config parameters have the right format if they are present.
	 * @param {Object} [config] [optional] config as object
	 * @returns {Object} normalized config
	 */
	normalizeConfig(config = {}) {
		const normalized = config;
		if (config.schoolIdentifier) {
			const type = typeof config.schoolIdentifier;
			if (type === 'string') {
				normalized.schoolIdentifier = config.schoolIdentifier;
			} else {
				this.logWarning(`Converting '${type}' value for 'schoolIdentifier' to string.`);
				normalized.schoolIdentifier = String(config.schoolIdentifier);
			}
		}
		if (config.lastChange) {
			const type = typeof config.lastChange;
			if (type === 'number' || config.lastChange instanceof Date) {
				normalized.lastChange = config.lastChange;
			} else {
				this.logWarning(`Invalid data type for 'lastChange'. Expected 'number' or 'Date', but got '${type}'.`);
			}
		}
		this.logDebug('Normalized config', { config: normalized });
		return normalized;
	}

	/**
	 * Does the following steps:
	 *   * find all schools with associated TSP identifier
	 *   * fetch all TSP teachers, students, and classes; group by school identifier
	 *   * for every school:
	 *     * create teachers
	 *     * create students
	 *     * create classes
	 * @returns {Object} stats (see #constructor)
	 * @async
	 * @extends Syncer#steps
	 */
	async steps() {
		let [teacherMap, studentMap, classMap] = [[], [], []];

		this.logInfo('Looking for schools...');
		const schools = await this.findSchools();
		this.logInfo(`${schools.length} schools found.`);
		if (schools.length > 0) {
			this.logInfo('Requesting and grouping entities. This can take a while...');
			// fetch entities in parallel and create a mapping (schoolIdentifier => list<Entity>)
			[teacherMap, studentMap, classMap] = await Promise.all(
				['teachers', 'students', 'classes'].map((type) => this.fetch(type).then(this.createSchoolMap))
			);
			this.logInfo('Done.');
		}

		for (const school of schools) {
			const { schoolIdentifier } = school.sourceOptions;
			this.logInfo(`Syncing ${school.name} (${school.sourceOptions.schoolIdentifier})...`);

			// find all teachers/students/classes of this school
			const schoolTeachers = teacherMap[schoolIdentifier] || [];
			const schoolStudents = studentMap[schoolIdentifier] || [];
			const schoolClasses = classMap[schoolIdentifier] || [];
			this.logInfo(
				`School has ${schoolTeachers.length} teachers, ${schoolStudents.length} students` +
					`, and ${schoolClasses.length} classes.`
			);

			const teacherMapping = {};
			const classMapping = {};

			this.logInfo('Syncing teachers...');
			// create teachers and add them to the mapping (teacherUID => User)
			for (const tspTeacher of schoolTeachers) {
				const teacher = await this.createOrUpdateTeacher(tspTeacher, school);
				if (teacher !== null) {
					teacherMapping[tspTeacher.lehrerUid] = teacher;
				}
			}

			this.logInfo('Syncing students...');
			// create students and add them to the mapping (classUid => [User])
			for (const tspStudent of schoolStudents) {
				const student = await this.createOrUpdateStudent(tspStudent, school);
				if (student !== null) {
					classMapping[tspStudent.klasseId] = classMapping[tspStudent.klasseId] || [];
					classMapping[tspStudent.klasseId].push(student._id);
				}
			}

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
	 * Returns all TSP schools
	 * @returns {Array<School>}
	 * @async
	 */
	async findSchools() {
		const query = {
			source: ENTITY_SOURCE,
		};
		if (this.config.schoolIdentifier) {
			query['sourceOptions.schoolIdentifier'] = this.config.schoolIdentifier;
		}
		return this.app.service('schools').find({
			query,
			paginate: false,
		});
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
			result = await this.api.request(strings[type].url, this.config.lastChange);
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
	 * @returns {User} the user object of the SC-Teacher
	 * @async
	 */
	async createOrUpdateTeacher(tspTeacher, school) {
		const systemId = school.systems[0];
		const query = {
			source: ENTITY_SOURCE,
			[`sourceOptions.${SOURCE_ID_ATTRIBUTE}`]: {
				$in: [
					tspTeacher.lehrerUid,
					// try to heal if school change process was interupted before the invalidated user was deleted:
					getInvalidatedUuid(tspTeacher.lehrerUid),
				],
			},
		};
		const users = await this.app.service('users').find({ query });
		if (users.total > 0) {
			const oldUser = users.data[0];
			if (!sameObjectId(oldUser.schoolId, school._id)) {
				// school change detected
				return switchSchool(this.app, oldUser, this.createTeacher.bind(this, tspTeacher, school, systemId));
			}
			return this.updateTeacher(oldUser, tspTeacher);
		}
		return this.createTeacher(tspTeacher, school, systemId);
	}

	/**
	 * Patches a Schul-Cloud user based on information from a TSP teacher object
	 * @param {User} user the current user
	 * @param {Object} tspTeacher TSP teacher object
	 * @returns {User|null} the patched user or null (on error)
	 * @async
	 */
	async updateTeacher(user, tspTeacher) {
		try {
			const equal =
				(user.namePrefix === tspTeacher.lehrerTitel || (!user.namePrefix && !tspTeacher.namePrefix)) &&
				user.firstName === tspTeacher.lehrerVorname &&
				user.lastName === tspTeacher.lehrerNachname;
			if (equal) {
				this.stats.users.teachers.unchanged += 1;
				return user;
			}

			const teacher = await this.app.service('users').patch(user._id, {
				namePrefix: tspTeacher.lehrerTitel,
				firstName: tspTeacher.lehrerVorname,
				lastName: tspTeacher.lehrerNachname,
			});
			this.stats.users.teachers.updated += 1;
			return teacher;
		} catch (err) {
			this.stats.users.teachers.errors += 1;
			this.logError('User update error', err, user._id, tspTeacher);
			this.stats.errors.push({
				type: 'update-teacher',
				entity: tspTeacher.lehrerUid,
				message: `Lehrer "${tspTeacher.lehrerVorname} ${tspTeacher.lehrerNachname}" konnte nicht aktualisiert werden.`,
			});
			return null;
		}
	}

	/**
	 * Create a Schul-Cloud user based on a TSP teacher object
	 * @param {Object} tspTeacher TSP teacher object
	 * @param {School} school the user's school
	 * @param {System} systemId the login system used for account creation
	 * @returns {User|null} the user or null (on error)
	 * @async
	 */
	async createTeacher(tspTeacher, school, systemId) {
		try {
			const sourceOptions = {};
			sourceOptions[SOURCE_ID_ATTRIBUTE] = tspTeacher.lehrerUid;
			const teacher = await createUserAndAccount(
				this.app,
				{
					namePrefix: tspTeacher.lehrerTitel,
					firstName: tspTeacher.lehrerVorname,
					lastName: tspTeacher.lehrerNachname,
					schoolId: school._id,
					source: ENTITY_SOURCE,
					sourceOptions,
				},
				'teacher',
				systemId
			);
			this.stats.users.teachers.created += 1;
			return teacher;
		} catch (err) {
			this.stats.users.teachers.errors += 1;
			this.logError('User creation error', err, tspTeacher);
			this.stats.errors.push({
				type: 'create-teacher',
				entity: tspTeacher.lehrerUid,
				message: `Lehrer "${tspTeacher.lehrerVorname} ${tspTeacher.lehrerNachname}" konnte nicht erstellt werden.`,
			});
			return null;
		}
	}

	/**
	 * Creates or updates a Schul-Cloud user based on a TSP student object
	 * @param {Object} tspStudent TSP student object
	 * @param {School} school school of the user
	 * @returns {User} the user object of the SC-Student
	 * @async
	 */
	async createOrUpdateStudent(tspStudent, school) {
		const systemId = school.systems[0];
		const query = {
			source: ENTITY_SOURCE,
			[`sourceOptions.${SOURCE_ID_ATTRIBUTE}`]: {
				$in: [
					tspStudent.schuelerUid,
					// try to heal if school change process was interupted before the invalidated user was deleted:
					getInvalidatedUuid(tspStudent.schuelerUid),
				],
			},
		};
		const users = await this.app.service('users').find({ query });
		if (users.total !== 0) {
			const oldUser = users.data[0];
			if (!sameObjectId(oldUser.schoolId, school._id)) {
				// school change detected
				return switchSchool(this.app, oldUser, this.createStudent.bind(this, tspStudent, school, systemId));
			}
			return this.updateStudent(oldUser, tspStudent);
		}
		return this.createStudent(tspStudent, school, systemId);
	}

	/**
	 * Patches a Schul-Cloud user based on information from a TSP student object
	 * @param {User} user the current user
	 * @param {Object} tspStudent TSP student object
	 * @returns {User|null} the patched user or null (on error)
	 * @async
	 */
	async updateStudent(user, tspStudent) {
		try {
			const equal = user.firstName === tspStudent.schuelerVorname && user.lastName === tspStudent.schuelerNachname;
			if (equal) {
				this.stats.users.students.unchanged += 1;
				return user;
			}

			const student = await this.app.service('users').patch(user._id, {
				firstName: tspStudent.schuelerVorname,
				lastName: tspStudent.schuelerNachname,
			});
			this.stats.users.students.updated += 1;
			return student;
		} catch (err) {
			this.stats.users.students.errors += 1;
			this.logError('User update error', err, user._id, tspStudent);
			this.stats.errors.push({
				type: 'update-student',
				entity: tspStudent.schuelerUid,
				message:
					`Schüler "${tspStudent.schuelerVorname} ${tspStudent.schuelerNachname}"` +
					' konnte nicht aktualisiert werden.',
			});
			return null;
		}
	}

	/**
	 * Create a Schul-Cloud user based on a TSP student object
	 * @param {Object} tspStudent TSP student object
	 * @param {School} school the user's school
	 * @param {System} systemId the login system used for account creation
	 * @returns {User|null} the user or null (on error)
	 * @async
	 */
	async createStudent(tspStudent, school, systemId) {
		try {
			const sourceOptions = {};
			sourceOptions[SOURCE_ID_ATTRIBUTE] = tspStudent.schuelerUid;
			const student = await createUserAndAccount(
				this.app,
				{
					firstName: tspStudent.schuelerVorname,
					lastName: tspStudent.schuelerNachname,
					schoolId: school._id,
					source: ENTITY_SOURCE,
					sourceOptions,
				},
				'student',
				systemId
			);
			this.stats.users.students.created += 1;
			return student;
		} catch (err) {
			this.stats.users.students.errors += 1;
			this.logError('User creation error', err, tspStudent);
			this.stats.errors.push({
				type: 'create-student',
				entity: tspStudent.schuelerUid,
				message: `Schüler "${tspStudent.schuelerVorname} ${tspStudent.schuelerNachname}" konnte nicht erstellt werden.`,
			});
			return null;
		}
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
		return Promise.all(
			classes.map((klass) => {
				const sourceOptions = {};
				sourceOptions[SOURCE_ID_ATTRIBUTE] = klass.klasseId;
				const query = {
					source: ENTITY_SOURCE,
					sourceOptions,
				};
				const teacher = teacherMapping[klass.lehrerUid];
				const options = {
					name: klass.klasseName,
					schoolId: school._id,
					year: school.currentYear,
					teacherIds: teacher ? [teacher] : [],
					userIds: classMapping[klass.klasseId] || [],
					source: ENTITY_SOURCE,
					sourceOptions,
				};
				const onlyAddNew = this.config.lastChange !== undefined;
				return this.createOrUpdateClass(options, query, onlyAddNew); // see ClassImporter mixin
			})
		);
	}
}

module.exports = {
	TSPSchoolSyncer,
	SYNCER_TARGET,
};
