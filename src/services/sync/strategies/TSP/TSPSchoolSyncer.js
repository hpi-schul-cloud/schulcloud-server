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

class TSPSchoolSyncer extends mix(Syncer).with(ClassImporter) {
	static respondsTo(target) {
		return target === SYNCER_TARGET;
	}

	static params(params, data) {
		const config = ((params || {}).query || {}).config || (data || {}).config;
		if (!config) {
			throw new BadRequest('Missing parameter "config".');
		}
		if (!config.baseUrl) {
			throw new BadRequest('Missing parameter "config.baseUrl" (URL that points to the TSP Server).');
		}
		return [config];
	}

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

		this.currentYear = undefined;
		this.federalState = undefined;
	}

	async steps() {
		let [teacherMap, studentMap, classMap] = [[], [], []];

		const systems = await this.findSystems();
		if (systems.length > 0) {
			// fetch entities in parallel
			[teacherMap, studentMap, classMap] = await Promise.all(['teachers', 'students', 'classes']
				.map((type) => this.fetch(type).then(this.createSchoolMap)));
		}
		// create a mapping (schoolIdentifier => list<Entity>)

		for (const system of systems) {
			let school = await this.findSchool(system);
			if (!school) school = await this.createSchool(system);

			const schoolTeachers = teacherMap[(system.tsp || {}).schoolIdentifier];
			const schoolStudents = studentMap[(system.tsp || {}).schoolIdentifier];
			const schoolClasses = classMap[(system.tsp || {}).schoolIdentifier];

			const teacherMapping = {};
			const classMapping = {};

			await Promise.all(schoolTeachers.map(async (tspTeacher) => {
				const teacher = await this.createOrUpdateTeacher(tspTeacher, school, system, classMapping);
				teacherMapping[tspTeacher.lehrerUid] = teacher;
			}));
			await Promise.all(schoolStudents.map(async (tspStudent) => {
				const student = await this.createOrUpdateStudent(tspStudent, school, system, classMapping);
				classMapping[tspStudent.klasseId] = (classMapping[tspStudent.klasseId] || []).push(student._id);
			}));

			await this.createClasses(schoolClasses, school, teacherMapping, classMapping);
		}
	}

	createSchoolMap(list) {
		const globalMap = {};
		list.forEach((item) => {
			const k = item.schuleNummer;
			globalMap[k] = (globalMap[k] || []).push(item);
		});
		return globalMap;
	}

	async createSchool(system) {
		return this.app.service('schools').create({
			name: system.tsp.schoolName,
			systems: [system._id],
			currentYear: await this.getCurrentYear(),
			federalState: await this.getFederalState(),
		});
	}

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

	async findSystems() {
		if (this.config.systemId) {
			const system = await this.app.service('systems').get(this.config.systemId);
			this.config.schoolIdentifier = (system.tsp || {}).identifier;
			return [system];
		}
		if (this.config.schoolIdentifier) {
			const systems = await this.app.service('systems').find({
				query: {
					'tsp.identifier': this.config.schoolIdentifier,
				},
			});
			return systems.data;
		}
		return this.app.service('systems').find({
			query: {
				type: SYNCER_TARGET,
			},
			paginate: false,
		});
	}

	async findSchool(system) {
		const response = await this.app.service('schools').find({
			query: {
				systems: system._id,
				$limit: 1,
			},
		});
		if (!Array.isArray(response.data) || response.total < 1) {
			this.logWarning(`No school found for system "${system.alias}" (${system._id}).`, system);
			this.stats.errors.push({
				type: 'find-school',
				entity: system._id.toString(),
				message: 'Zum System gehörende Schule existiert nicht.',
			});
			return null;
		}
		return response.data[0];
	}

	async fetch(type) {
		const strings = {
			teachers: { de: 'Lehrer', url: '/tip-ms/api/schulverwaltung_export_lehrer' },
			students: { de: 'Schüler', url: '/tip-ms/api/schulverwaltung_export_schueler' },
			classes: { de: 'Klassen', url: '/tip-ms/api/schulverwaltung_export_klasse' },
		};
		let result = [];
		try {
			result = await this.api.request(strings[type].url);
			if (this.config.schoolIdentifier) {
				result = result.filter((t) => t.schuleNummer === this.config.schoolIdentifier);
			}
		} catch (err) {
			this.logError('Cannot fetch classes.', err);
			this.stats.errors.push({
				type: `fetch-${type}`,
				message: `Es ist derzeit nicht möglich ${strings[type].de}daten aus dem TSP zu aktualisieren.`,
			});
		}
		return result;
	}

	async createOrUpdateTeacher(tspTeacher, school, system) {
		const query = { source: ENTITY_SOURCE };
		query[`sourceOptions.${SOURCE_ID_ATTRIBUTE}`] = tspTeacher.lehrerUid;
		const users = await this.app.service('users').find({ query });
		if (users.total > 0) {
			return this.updateTeacher(users.data[0]._id, tspTeacher);
		}
		return this.createTeacher(tspTeacher, school, system);
	}

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

	async createOrUpdateStudent(tspStudent, school, system) {
		const query = { source: ENTITY_SOURCE };
		query[`sourceOptions.${SOURCE_ID_ATTRIBUTE}`] = tspStudent.schuelerUid;
		const users = await this.app.service('users').find({ query });
		if (users.total !== 0) {
			return this.updateStudent(users.data[0]._id, tspStudent);
		}
		return this.createStudent(tspStudent, school, system);
	}

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

	createClasses(classes, school, teacherMapping, classMapping) {
		return Promise.all(classes.map((klass) => {
			const className = klass.klasseName;
			const sourceOptions = {};
			sourceOptions[SOURCE_ID_ATTRIBUTE] = klass.klasseId;
			const options = {
				schoolId: school._id,
				year: school.currentYear,
				teacherIds: [teacherMapping[klass.klasseId]],
				userIds: classMapping[klass.klasseId],
				source: ENTITY_SOURCE,
				sourceOptions,
			};
			return this.findOrCreateClassByName(className, options);
		}));
	}
}

module.exports = {
	TSPSchoolSyncer,
	SYNCER_TARGET,
};
