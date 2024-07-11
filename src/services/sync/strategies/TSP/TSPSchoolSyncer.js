const _ = require('lodash');
const { mix } = require('mixwith');
const pLimit = require('p-limit');
const { Configuration } = require('@hpi-schul-cloud/commons');

const Syncer = require('../Syncer');
const ClassImporter = require('../mixins/ClassImporter');
const { equal: sameObjectId } = require('../../../../helper/compare').ObjectId;

const { TspApi, config: TSP_CONFIG, ENTITY_SOURCE, SOURCE_ID_ATTRIBUTE, createUserAndAccount } = require('./TSP');

const { switchSchool, getInvalidatedUuid } = require('./SchoolChange');

const SYNCER_TARGET = 'tsp-school';
const schoolLimit = pLimit(Configuration.get('TSP_SCHOOL_SYNCER__SCHOOL_LIMIT'));
const limit = pLimit(Configuration.get('TSP_SCHOOL_SYNCER__STUDENTS_TEACHERS_CLASSES_LIMIT'));

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

		this.lastSyncedAtEnabled = Configuration.get('FEATURE_SYNC_LAST_SYNCED_AT_ENABLED') === true;

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
		await Promise.all(
			schools.map((school) => schoolLimit(() => this.processSchool(school, teacherMap, studentMap, classMap)))
		);
		this.logInfo('Done.');
	}

	/**
	 * For a school:
	 *   * create teachers
	 *   * create students
	 *   * create classes
	 * @param {Object} school
	 * @param {Object} teacherMap
	 * @param {Object} studentMap
	 * @param {Object} classMap
	 * @async
	 */
	async processSchool(school, teacherMap, studentMap, classMap) {
		try {
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
			const teacherMapping = await this.processTSPTeachers(schoolTeachers, school);
			const studentMapping = await this.processTSPStudents(schoolStudents, school);
			this.logInfo('Syncing classes...');
			// create classes based on API response and user mappings
			await this.createOrUpdateClasses(schoolClasses, school, teacherMapping, studentMapping);

			this.logInfo('Done.');
		} catch (err) {
			this.handleError('Error while syncing process TSP Schools', err);
		}
	}

	/**
	 * Create students and return studentMapping
	 * @param {Array} schoolStudents
	 * @param {Object} school
	 * @returns {Map} (classIdentifier => [Entity])
	 * @async
	 */
	async processTSPStudents(schoolStudents, school) {
		const studentMapping = new Map();
		this.logInfo('Syncing students...');
		// create students and add them to the mapping (classUid => [User])
		await Promise.all(
			schoolStudents.map((tspStudent) => limit(() => this.processStudent(tspStudent, school, studentMapping)))
		);
		return studentMapping;
	}

	/**
	 * Create student and add entry to studentMapping
	 * @param {Object} tspStudent
	 * @param {Object} school
	 * @param {Map} studentMapping
	 * @async
	 */
	async processStudent(tspStudent, school, studentMapping) {
		try {
			const student = await this.createOrUpdateStudent(tspStudent, school);
			if (student !== null) {
				studentMapping.set(tspStudent.klasseId, studentMapping.get(tspStudent.klasseId) || []);
				studentMapping.get(tspStudent.klasseId).push(student._id);
			}
		} catch (err) {
			this.handleError('Error while syncing process TSP Students', err);
		}
	}

	/**
	 * Create teachers and return teacherMapping
	 * @param {Array} schoolTeachers
	 * @param {Object} school
	 * @returns {Map} (teacherIdentifier => [Entity])
	 * @async
	 */
	async processTSPTeachers(schoolTeachers, school) {
		const teacherMapping = new Map();
		this.logInfo('Syncing teachers...');
		// create teachers and add them to the mapping (teacherUID => User)
		await Promise.all(
			schoolTeachers.map((tspTeacher) => limit(() => this.processTeacher(tspTeacher, school, teacherMapping)))
		);
		return teacherMapping;
	}

	/**
	 * Create teacher and add entry to teacherMapping
	 * @param {Object} tspTeacher
	 * @param {Object} school
	 * @param {Map} teacherMapping
	 * @async
	 */
	async processTeacher(tspTeacher, school, teacherMapping) {
		try {
			const teacher = await this.createOrUpdateTeacher(tspTeacher, school);
			if (teacher !== null) {
				teacherMapping.set(tspTeacher.lehrerUid, teacher);
			}
		} catch (err) {
			this.handleError('Error while syncing process TSP Teachers', err);
		}
	}

	/**
	 * Log error and add error to stats
	 * @param {String} message
	 * @param {Object} error
	 */
	handleError(message, error) {
		this.logError(message, { error });
		this.stats.errors.push(error);
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
			if (oldUser.email === tspTeacher.email) {
				await this.app.service('nest-account-service').deleteByUserId({ userId: oldUser._id.toString() });
			}
			return this.updateTeacher(oldUser, tspTeacher, systemId);
		}
		return this.createTeacher(tspTeacher, school, systemId);
	}

	prepareTeacherUpdateObject(user, tspTeacher) {
		const updateObject = {};

		// Check if anything has changed on the TSP side regarding teacher's data
		// and, if yes, set all the current data in the teacher's update object.
		const equal =
			(user.namePrefix === tspTeacher.lehrerTitel || (!user.namePrefix && !tspTeacher.namePrefix)) &&
			user.firstName === tspTeacher.lehrerVorname &&
			user.lastName === tspTeacher.lehrerNachname;
		if (!equal) {
			updateObject.namePrefix = tspTeacher.lehrerTitel;
			updateObject.firstName = tspTeacher.lehrerVorname;
			updateObject.lastName = tspTeacher.lehrerNachname;
		}

		// If the feature flag is enabled, add the last synced at field
		// (with value set to the current date) to the teacher's update object.
		if (this.lastSyncedAtEnabled) {
			updateObject.lastSyncedAt = new Date();
		}

		return updateObject;
	}

	/**
	 * Patches a Schul-Cloud user based on information from a TSP teacher object
	 * @param {User} user the current user
	 * @param {Object} tspTeacher TSP teacher object
	 * @returns {User|null} the patched user or null (on error)
	 * @async
	 */
	async updateTeacher(user, tspTeacher, systemId) {
		try {
			const updateObject = this.prepareTeacherUpdateObject(user, tspTeacher);

			// Check if the teacher's update object is empty which would mean that both:
			//   1. no data has been changed on the TSP side;
			//   2. "last synced at" feature flag is disabled.
			// If any of these two is not true, the teacher's object will be updated.
			if (_.isEmpty(updateObject)) {
				this.stats.users.teachers.unchanged += 1;

				return user;
			}

			const teacher = await this.app.service('users').patch(user._id, updateObject);
			await this.app.service('nest-account-service').save({
				userId: user._id.toString(),
				username: user.email,
				systemId,
				activated: true,
			});

			this.stats.users.teachers.updated += 1;

			return teacher;
		} catch (err) {
			this.stats.users.teachers.errors += 1;
			this.logError('User update error', err, user._id, tspTeacher);
			this.stats.errors.push({
				type: 'update-teacher',
				entity: tspTeacher.lehrerUid,
				message: `teacher "${tspTeacher.lehrerVorname} ${tspTeacher.lehrerNachname}" with tsp id ${tspTeacher.lehrerUid} and user id ${user._id} could not be updated. weil ${err.message}`,
			});

			return null;
		}
	}

	prepareTeacherCreateObject(schoolId, tspTeacher) {
		const createObject = {
			namePrefix: tspTeacher.lehrerTitel,
			firstName: tspTeacher.lehrerVorname,
			lastName: tspTeacher.lehrerNachname,
			schoolId,
			source: ENTITY_SOURCE,
			sourceOptions: { [SOURCE_ID_ATTRIBUTE]: tspTeacher.lehrerUid },
		};

		// If the feature flag is enabled, add the last synced at field
		// (with value set to the current date) to the teacher's create object.
		if (this.lastSyncedAtEnabled) {
			createObject.lastSyncedAt = new Date();
		}

		return createObject;
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
			const createObject = this.prepareTeacherCreateObject(school._id, tspTeacher);

			const teacher = await createUserAndAccount(this.app, createObject, 'teacher', systemId);

			this.stats.users.teachers.created += 1;

			return teacher;
		} catch (err) {
			this.stats.users.teachers.errors += 1;
			this.logError('User creation error', err, tspTeacher);
			this.stats.errors.push({
				type: 'create-teacher',
				entity: tspTeacher.lehrerUid,
				message: `Lehrer "${tspTeacher.lehrerVorname} ${tspTeacher.lehrerNachname}" konnte nicht erstellt werden. weil ${err.message}`,
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
			if (oldUser.email === tspStudent.email) {
				await this.app.service('nest-account-service').deleteByUserId({ userId: oldUser._id.toString() });
			}
			return this.updateStudent(oldUser, tspStudent, systemId);
		}
		return this.createStudent(tspStudent, school, systemId);
	}

	prepareStudentUpdateObject(user, tspStudent) {
		const updateObject = {};

		// Check if anything has changed on the TSP side regarding student's data
		// and, if yes, set all the current data in the student's update object.
		const equal = user.firstName === tspStudent.schuelerVorname && user.lastName === tspStudent.schuelerNachname;
		if (!equal) {
			updateObject.firstName = tspStudent.schuelerVorname;
			updateObject.lastName = tspStudent.schuelerNachname;
		}

		// If the feature flag is enabled, add the last synced at field
		// (with value set to the current date) to the student's update object.
		if (this.lastSyncedAtEnabled) {
			updateObject.lastSyncedAt = new Date();
		}

		return updateObject;
	}

	/**
	 * Patches a Schul-Cloud user based on information from a TSP student object
	 * @param {User} user the current user
	 * @param {Object} tspStudent TSP student object
	 * @returns {User|null} the patched user or null (on error)
	 * @async
	 */
	async updateStudent(user, tspStudent, systemId) {
		try {
			const updateObject = this.prepareStudentUpdateObject(user, tspStudent);

			// Check if the student's update object is empty which would mean that both:
			//   1. no data has been changed on the TSP side;
			//   2. "last synced at" feature flag is disabled.
			// If any of these two is not true, the student's object will be updated.
			if (_.isEmpty(updateObject)) {
				this.stats.users.students.unchanged += 1;

				return user;
			}

			const student = await this.app.service('users').patch(user._id, updateObject);
			await this.app.service('nest-account-service').save({
				userId: user._id.toString(),
				username: user.email,
				systemId,
				activated: true,
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
					`student "${tspStudent.schuelerVorname} ${tspStudent.schuelerNachname}"` +
					` with tsp id ${tspStudent.schuelerUid} and user id ${user._id} could not be updated.`,
			});

			return null;
		}
	}

	prepareStudentCreateObject(schoolId, tspStudent) {
		const createObject = {
			firstName: tspStudent.schuelerVorname,
			lastName: tspStudent.schuelerNachname,
			schoolId,
			source: ENTITY_SOURCE,
			sourceOptions: { [SOURCE_ID_ATTRIBUTE]: tspStudent.schuelerUid },
		};

		// If the feature flag is enabled, add the last synced at field
		// (with value set to the current date) to the student's create object.
		if (this.lastSyncedAtEnabled) {
			createObject.lastSyncedAt = new Date();
		}

		return createObject;
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
			const createObject = this.prepareStudentCreateObject(school._id, tspStudent);

			const student = await createUserAndAccount(this.app, createObject, 'student', systemId);

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
	 * @param {Map} teacherMapping a mapping (teacherUid => User)
	 * @param {Map} studentMapping a mapping (classUid => [User])
	 * @returns {Array<Class>} created classes
	 * @async
	 */
	createOrUpdateClasses(classes, school, teacherMapping, studentMapping) {
		return Promise.all(
			classes.map((klass) => limit(() => this.createOrUpdateOneClass(klass, school, teacherMapping, studentMapping)))
		);
	}

	/**
	 * Creates classes based on TSP API response
	 * @param {*} klass TSP class objects
	 * @param {*} school school
	 * @param {Map} teacherMapping a mapping (teacherUid => User)
	 * @param {Map} studentMapping a mapping (classUid => [User])
	 * @returns {Class} created class
	 */
	createOrUpdateOneClass(klass, school, teacherMapping, studentMapping) {
		const sourceOptions = {};
		sourceOptions[SOURCE_ID_ATTRIBUTE] = klass.klasseId;
		const query = {
			source: ENTITY_SOURCE,
			sourceOptions,
		};
		const teacher = teacherMapping.get(klass.lehrerUid);
		const options = {
			name: klass.klasseName,
			schoolId: school._id,
			year: school.currentYear,
			teacherIds: teacher ? [teacher] : [],
			userIds: studentMapping.get(klass.klasseId) || [],
			source: ENTITY_SOURCE,
			sourceOptions,
		};
		const onlyAddNew = this.config.lastChange !== undefined;
		return this.createOrUpdateClass(options, query, onlyAddNew); // see ClassImporter mixin
	}
}

module.exports = {
	TSPSchoolSyncer,
	SYNCER_TARGET,
};
