const assert = require('assert');

const WebUntisBaseSyncer = require('./WebUntisBaseSyncer');


/**
 * Implements syncing from WebUntis API based on the Syncer interface
 * @class WebUntisSchoolyearSyncer
 * @implements {Syncer}
 */
class WebUntisSchoolyearSyncer extends WebUntisBaseSyncer {
	/**
    * Constructor
    *
    * Disabled because of ESlint
    *
    * @param {*} app
    * @param {*} stats
    * @param {*} logger
	* @param {*} data
	* 
	* Current data structure: {
	*	datasourceId: associated SchuldCloud data source id,
	*	username: Username for the user to access WebUntis,
	*	password: Password for the user to access WebUntis,
	*	url: URL of the WebUntis endpoint,
	*	datatype: 'inclusive' or 'exclusive', depending on the intended semantics for courseMetadataIds
	*	courseMetadataIds: list of metadata IDs to consider for inclusion/rejection
	*	dryrun: collect metadata instead of synching
	* }
    */
	/* constructor(app, stats, logger, data) {
		super(app, stats, logger, data);
	} */

	/**
	 * @see {Syncer#respondsTo}
	 */
	static respondsTo(target) {
		return target === 'webuntis-schoolyear';
	}

	static params(params, data = {}) {
		// TODO: check usage of params. params.query, and data
		
		const query = (params || {}).query || {};
		
		const validData = (
			['inclusive', 'exclusive'].includes(data.datatype) || (!data.datatype && !data.courseMetadataIds)
		);

		if (!validParams || !validData) {
			return false;
		}
		
		return [{
			datasourceId: params.datasourceId,
			datatype: data.datatype,
			courseMetadataIds: data.courseMetadataIds,
			dryrun: !("dryrun" in params.query) || params.query.dryrun !== 'false',
		}];
	}

	/**
	* @see {Syncer#steps}
    *
	* Perform either fetching from WebUntis and storing metadata into 'webuntisMetadata' or
	* Creating actual schulcloud 'courses'.
	*/
	steps() {
		this.logInfo(`Running WebUntis School Year Sync.\n`);

		if (this.data.dryrun) {
			return this.createMetaDataFromWebUntisSteps(this.data);
		} else {
			return this.createCoursesFromMetaDataAndWebUntisSteps(this.data);
		}
	}

	/**
	* 
	*/
	createMetaDataFromWebUntisSteps(params) {
		return this.obtainWebUntisConfig()
			.then((config) => this.login(config))
			.then((session) => Promise.allSettled([
				Promise.resolve(session),
				this.fetchMetadata(session, params)
			]))
			.then(([sessionResult, metadataResult]) => Promise.allSettled([
				this.logout(sessionResult.value),
				this.storeMetadata(metadataResult.value || {})
			]))
			.then(([logoutResult, metadataCreationResult]) => Promise.resolve(metadataCreationResult.value || {}));
	}

	/**
	* 
	*/
	createCoursesFromMetaDataAndWebUntisSteps(params) {
		return Promise.allSettled([
				this.obtainMetadata(params),
				this.obtainWebUntisConfig(params)
					.then((config) => this.login(config))
			])
			.then(([metadataResult, sessionResult]) => Promise.allSettled([
				Promise.resolve(sessionResult.value),
				this.fetchData(sessionResult.value, metadataResult.value || {})
			]))
			.then(([sessionResult, dataResult]) => Promise.allSettled([
				this.logout(sessionResult.value),
				this.createCourses(dataResult.value || {})
			]))
			.then(([logoutResult, courseCreationResult]) => Promise.resolve(courseCreationResult.value || {}));
	}

	/**
	* 
	*/
	obtainWebUntisConfig() {
		return Promise.resolve({
			alias: 'Test WebUntis',
			type: 'webuntis',
			webuntisConfig: {
				active: true,
				url: '[URL]',
				schoolname: '[schoolname]',
				user: '[username]',
				password: '[password]',
			},
		});
	}

	/**
	* 
	* @param {*} params 
	*/
	obtainMetadata(params) {
		return Promise.resolve({});
	}

	/**
	* 
	* @param {*} config 
	*/
	login(config) {
		await super.login(config.url, config.schoolname, config.user, config.password);

		return Promise.resolve({
			session: this.session,
			rpc: this.rpc
		});
	}

	/**
	* 
	* @param {*} session 
	*/
	fetchMetaData(session) {
		return Promise.resolve({});
	}

	/**
	* 
	* @param {*} session 
	* @param {*} metadata 
	*/
	fetchData(session, metadata) {
		return Promise.resolve({});
	}

	/**
	* 
	* @param {*} session 
	*/
	logout(session) {
		super.logout();
	}

	/**
	* 
	* @param {*} metadata 
	*/
	storeMetadata(metadata) {
		return Promise.resolve({});
	}

	/**
	* 
	* @param {*} data 
	*/
	createCourses(data) {
		return Promise.resolve({});
	}

	// Former implementation

	/**
	 * @see {Syncer#steps}
     *
     * Steps:
     * * Check for WebUntis system (may have configured none)
     * * Login to WebUntis
     * * Fetch Lesson/Teacher/Room/... changes
     * * Migrate the changes
     * * Generate events using text templates
     * * Send out events for all affected student/teacher/...
     *
     * Assumptions:
     * * Each school has one WebUntis system at most
     * * This syncer has to be triggered for each school individually
	 */
	steps() {
		this.logInfo(`Running WebUntis Sync in dry run: ${this.data.dryrun}.\n`);

		/* Why not
        return this.getWebUntisSystems().then(
            systems => {
                // ...
            }
        );
        ? */
		return this.getUser()
			.then(user => this.getWebUntisSystems(user))
			.then(([systems, school]) => {
				/* TODO: Remove later */
				// if (systems.length === 0) {
				// Configure test environment until configuration is available via GUI
				systems[0] = {
					alias: 'Test WebUntis',
					type: 'webuntis',
					webuntisConfig: {
						active: true,
						url: '[URL]',
						schoolname: '[schoolname]',
						user: '[username]',
						password: '[password]',
					},
				};
				// }

				if (systems.length === 0) {
					return Promise.reject(
						new Error('No WebUntis configuration for associated school.'),
					);
				}
				this.logInfo(`Found ${systems.length} WebUntis configurations for school ${school.name}.\n`);
				
				return Promise.all(systems.map((system) => {
					this.stats.systems[school.name] = {};
					return this.syncFromSystem(system, this.stats.systems[school.name], school);
				}));
			});
	}

	syncFromSystem(system, stats, school) {
		return this.login(system.webuntisConfig.url, system.webuntisConfig.schoolname,
			system.webuntisConfig.user, system.webuntisConfig.password)
			.then(() => this.fetchInformation())
			.then((data) => {
				this.logout();
				stats.temp = data;
				return Promise.resolve(data);
			})
			/*.then(data => {
				if (this.dryrun) {
					return this.collectData(data, stats, school);
				} else {
					return this.migrateData(data, stats, school);
				}
			})*/
			.then(() => {
				stats.success = true;
			});
	}

	async fetchInformation() {
		const intermediateData = {};
		const data = {};
		data.currentSchoolYear = await this.getCurrentSchoolyear();
		// intermediateData.holidays = await this.getHolidays();
		// data.subjects = await this.getSubjects(); // Ignore subjects for now
		intermediateData.classes = await this.getClasses(data.currentSchoolYear.id);
		intermediateData.timeGrid = await this.getTimegrid();
		intermediateData.teachers = await this.getTeachers();

		// data.holidayRanges = data.holidays.map(holiday => [ holiday.startDate, holiday.endDate ]);
		data.classes = intermediateData.classes.map(klass => ({
			id: klass.id,
			name: klass.longName,
			timetable: [],
		}));
		data.timeGrid = intermediateData.timeGrid.map(day => ({
			day: this.dayLookUp(day.day),
			timeUnits: day.timeUnits,
		}));

		if (intermediateData.teachers !== undefined) { // Iterate over teachers

			data.teachers = intermediateData.teachers.map(teacher => ({
				id: teacher.id,
				name: `${teacher.foreName} ${teacher.longName}`
			}));

			// TODO: remove
			data.teachers.length = 3;
			// END TODO: remove

			for (const teacher of data.teachers) {
				let timetable = await this.getCustomizableTimeTableFor(2, teacher.id, {
					startDate: data.currentSchoolYear.startDate,
					endDate: data.currentSchoolYear.endDate,
					onlyBaseTimetable: true,
					klasseFields: ['id', 'longname'],
					subjectFields: ['id', 'longname'],
					roomFields: ['id', 'longname'],
				});

				/* TODO: Check for change */
				timetable = timetable.filter(entry => entry.te.length === 1
					&& entry.te[0].id === teacher.id
					&& entry.kl.length > 0
					&& entry.ro.length === 1
					&& entry.su.length === 1);
				/* END TODO: Check for change */
	
				for (const entry of timetable) {
					for (const classEntry of entry.kl) {
						const klass = data.classes.find(k => k.id === classEntry.id);
	
						if (klass !== undefined) {
							klass.timetable.push({
								date: entry.date,
								startTime: entry.startTime,
								endTime: entry.endTime,
								teacher: teacher.name,
								subject: entry.su[0].longname,
								room: entry.ro[0].longname,
							});
						}
					}
				}
			}
		} else { // Iterate over rooms
			intermediateData.rooms = await this.getRooms();

			data.rooms = intermediateData.rooms.map(room => ({
				id: room.id,
				name: `${room.name} (${room.longName}${room.building !== '' ? `, ${room.building}` : ''})`,
			}));
	
			// TODO: remove
			data.rooms.length = 5;
			// END TODO: remove
	
			for (const room of data.rooms) {
				let timetable = await this.getCustomizableTimeTableFor(4, room.id, {
					startDate: data.currentSchoolYear.startDate,
					endDate: data.currentSchoolYear.endDate,
					onlyBaseTimetable: true,
					klasseFields: ['id', 'longname'],
					subjectFields: ['id', 'longname'],
					teacherFields: ['id', 'longname'],
				});
				timetable = timetable.filter(entry => entry.ro.length === 1
					&& entry.ro[0].id === room.id
					&& entry.kl.length > 0
					&& entry.te.length === 1
					&& entry.su.length === 1);
	
				for (const entry of timetable) {
					for (const classEntry of entry.kl) {
						const klass = data.classes.find(k => k.id === classEntry.id);
	
						if (klass !== undefined) {
							klass.timetable.push({
								date: entry.date,
								startTime: entry.startTime,
								endTime: entry.endTime,
								teacher: entry.te[0].longname,
								subject: entry.su[0].longname,
								room: room.name,
							});
						}
					}
				}
			}
		}

		return Promise.resolve(data);
	}

	async migrateData(data, stats, school) {
		assert.ok(!this.dryrun);

		const courseService = this.app.service('courses');
		const classService = this.app.service('classes');

		stats.classes = {};
		stats.classes.count = 0;
		stats.classes.createdCount = 0;
		stats.classes.reusedCount = 0;
		stats.courses = {};
		stats.courses.count = 0;
		stats.courses.createdCount = 0;
		stats.courses.reusedCount = 0;
		stats.times = {};
		stats.times.count = 0;

		/**
         * Mapping:
         *
         * Schul-Cloud: class, course (per class), lesson
         * WebUntis: class, subject
         * German: Klasse, Kurs, Fach, Schulstunde
         */

		for (const klass of data.classes) {
			/**
             * Obtain classes
             */
			const className = klass.name;
			this.logInfo(`Handle ${className}\n`);
			const scClasses = await classService.find({ query: { name: className }, paginate: false });

			let scClass = scClasses[0];
			if (scClass === undefined) {
				// Create Schul-Cloud class?
				const newClass = {
					name: className,
					schoolId: school._id,
					nameFormat: 'static',
					year: school.currentYear,
				};
				scClass = await classService.create(newClass);
				stats.classes.createdCount += 1;
			} else {
				stats.classes.reusedCount += 1;
			}

			const courses = {};
			const times = {};
			for (const timetableEntry of klass.timetable) {
				/** Obtain courses for subjects:
                 *
                 * - class
                 * - (teacher)
                 * - time series
                 * - room
                 */
				const subjectName = timetableEntry.subject;

				let scCourse = courses[subjectName];
				if (scCourse === undefined) {
					const courseName = `${subjectName} ${scClass.name}`;
					this.logInfo(`Handle ${courseName}\n`);
					const scCourses = await courseService.find({
						query: {
							name: courseName,
							classIds: scClass._id,
							schoolId: school._id,
						},
						paginate: false,
					});
					scCourse = scCourses[0];
					if (scCourse === undefined) {
						// Create Course
						const newCourse = {
							name: courseName,
							classIds: [scClass._id],
							schoolId: school._id,
							teacherIds: [],
						};

						scCourse = await courseService.create(newCourse);
						courses[subjectName] = scCourse;
						times[subjectName] = [];
						stats.courses.createdCount += 1;
					} else {
						courses[subjectName] = scCourse;
						stats.courses.reusedCount += 1;
						times[subjectName] = [];
					}
				}

				const newEntry = {
					weekday: this.getWeekDay(timetableEntry.date),
					startTime: this.getStartTime(timetableEntry.startTime),
					duration: this.getDuration(timetableEntry.startTime, timetableEntry.endTime),
					room: timetableEntry.room,
					count: 1,
				};
				let entryFound = false;
				for (const givenEntry of times[subjectName]) {
					if (givenEntry.weekday === newEntry.weekday
                        && givenEntry.startTime === newEntry.startTime
                        && givenEntry.duration === newEntry.duration
                        && givenEntry.room === newEntry.room) {
						givenEntry.count += 1;
						entryFound = true;
					}
				}
				if (!entryFound) {
					times[subjectName].push(newEntry);
					stats.times.count += 1;
				}
			}

			for (const courseName in courses) {
				if ({}.hasOwnProperty.call(courses, courseName)) {
					const scCourse = courses[courseName];
					const courseTimes = times[courseName];
					// Update times, considered are events that occurs at least twice a year
					scCourse.times = courseTimes.filter(entry => entry.count >= 2).map(entry => ({
						weekday: entry.weekday,
						startTime: entry.startTime,
						duration: entry.duration,
						eventId: undefined,
						room: entry.room,
					}));
				}
			}
		}

		return Promise.resolve();
	}

	async collectData(data, stats, school) {
		assert.ok(this.dryrun);

		const courseService = this.app.service('courses');
		const classService = this.app.service('classes');

		stats.classes = {};

		/**
         * Mapping:
         *
         * Schul-Cloud: class, course (per class), lesson
         * WebUntis: class, subject
         * German: Klasse, Kurs, Fach, Schulstunde
         */

		for (const klass of data.classes) {
			/**
             * Obtain classes
             */
			const className = klass.name;
			this.logInfo(`Handle ${className}\n`);
			const scClasses = await classService.find({ query: { name: className }, paginate: false });

			let scClass = scClasses[0];
			if (scClass === undefined) {
				// Create Schul-Cloud class?
				const newClass = {
					name: className,
					schoolId: school._id,
					nameFormat: 'static',
					year: school.currentYear,
				};
				scClass = newClass;
				scClass._id = null;

				stats.classes[className] = {
					missing: true,
					name: className,
					courses: {},
				};
			} else {
				stats.classes[className] = {
					missing: true,
					name: className,
					courses: {},
				};
			}
			const statsClass = stats.classes[className];

			const times = {};
			for (const timetableEntry of klass.timetable) {
				/** Obtain courses for subjects:
                 *
                 * - class
                 * - (teacher)
                 * - time series
                 * - room
                 */
				const subjectName = timetableEntry.subject;

				let scCourse = statsClass.courses[subjectName];
				if (scCourse === undefined) {
					const courseName = `${subjectName} ${scClass.name}`;
					this.logInfo(`Handle ${courseName}\n`);
					const scCourses = await courseService.find({
						query: {
							name: courseName,
							classIds: scClass._id,
							schoolId: school._id,
						},
						paginate: false,
					});

					scCourse = scCourses[0];
					if (scCourse === undefined) {
						times[subjectName] = [];
						
						statsClass.courses[subjectName] = {
							missing: true,
							name: subjectName,
						};
					} else {
						times[subjectName] = [];

						statsClass.courses[subjectName] = {
							missing: false,
							name: subjectName,
						};
					}
				}

				const newEntry = {
					weekday: this.getWeekDay(timetableEntry.date),
					startTime: this.getStartTime(timetableEntry.startTime),
					duration: this.getDuration(timetableEntry.startTime, timetableEntry.endTime),
					room: timetableEntry.room,
					count: 1,
				};
				let entryFound = false;
				for (const givenEntry of times[subjectName]) {
					if (givenEntry.weekday === newEntry.weekday
                        && givenEntry.startTime === newEntry.startTime
                        && givenEntry.duration === newEntry.duration
                        && givenEntry.room === newEntry.room) {
						givenEntry.count += 1;
						entryFound = true;
					}
				}
				if (!entryFound) {
					times[subjectName].push(newEntry);
				}
			}

			for (const courseName in statsClass.courses) {
				if ({}.hasOwnProperty.call(statsClass.courses, courseName)) {
					const statsCourse = statsClass.courses[courseName];
					const courseTimes = times[courseName];
					// Update times, considered are events that occurs at least twice a year
					statsCourse.times = courseTimes.filter(entry => entry.count >= 2).map(entry => ({
						weekday: entry.weekday,
						startTime: entry.startTime,
						duration: entry.duration,
						eventId: undefined,
						room: entry.room,
					}));
				}
			}
		}

		return Promise.resolve();
	}
}

module.exports = WebUntisSchoolyearSyncer;
