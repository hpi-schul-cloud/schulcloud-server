const assert = require('assert');
const { BadRequest, NotImplemented } = require('@feathersjs/errors');
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
	*	webuntisConfig: {
	*	  username: Username for the user to access WebUntis,
	*	  password: Password for the user to access WebUntis,
	*	  url: URL of the WebUntis endpoint,
	*     schoolname: Identifier of the school in WebUntis
	*   },
	*   datasourceId: schul-cloud data source id to associate with WebUntis fetches,
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
		return target === 'webuntis';
	}

	static params(params, data = {}) {
		if (!params || !data) {
			return false;
		}

		const query = (params || {}).query || {}; // object containing url, username, password, and schoolname

		const validQuery = (
			query.username != '' &&
			query.url != '' &&
			query.password != '' &&
			query.schoolname != ''
		);
		
		const validData = (
			['inclusive', 'exclusive'].includes(data.data.type) || (!data.type && !data.data.courseMetadataIds) &&
			data.datasourceId != ''
		);

		if (!validData || !validQuery) {
			return false;
		}
		
		return [{
			userId: params.userId,
			webuntisConfig: {
				url: query.url,
				schoolname: query.schoolname,
				username: query.username,
				password: query.password,
			},
			datasourceId: data.datasourceId,
			datatype: data.data.type,
			courseMetadataIds: data.data.courseMetadataIds,
			dryrun: !("dryrun" in params) || (params.dryrun !== 'false' && params.dryrun !== false),
		}];
	}

	/**
	* @see {Syncer#steps}
    *
	* Perform either fetching from WebUntis and storing metadata into 'webuntisMetadata' or
	* Creating actual Schul-Cloud 'courses'.
	*/
	steps() {
		this.logInfo(`Running WebUntis School Year Sync.\n`);
		// this.logInfo(`Parameters `, this.data);

		if (this.data.dryrun) {
			return this.createMetaDataFromWebUntisSteps(this.data);
		} else {
			return this.createCoursesFromMetaDataAndWebUntisSteps(this.data);
		}
	}

	/**
	* 
	*/
	async createMetaDataFromWebUntisSteps(params) {
		this.stats.success = false;
		
		const config = params.webuntisConfig;

		const session = await this.login(config);
		const metaData = await this.fetchMetaData(session, params);
		await this.logout(session);
		await this.storeMetadata(metaData, params);

		this.stats.success = true;
	}

	/**
	* Note: Login to WebUntis is currently not required as all Metadata is fetched
	* during the first step
	*/
	async createCoursesFromMetaDataAndWebUntisSteps(params) {
		this.stats.success = false;

		const config = params.webuntisConfig;

		const metaData = await this.obtainMetadata(params);
		// const session = await this.login(config);
		const session = {};

		const data = await this.fetchData(session, metaData);

		// await this.logout(session);

		await this.createCourses(config, data, params);

		this.stats.success = true;
	}

	/**
	* 
	* @param {*} params 
	*/
	getImportConditionEvaluator(params) {
		if (params.datatype === 'inclusive') {
			if (!params.courseMetadataIds) {
				return ((id) => false);
			}
			return ((id) => params.courseMetadataIds.includes(id));
		}
		if (params.datatype === 'exclusive') {
			if (!params.courseMetadataIds) {
				return ((id) => false);
			}
			return ((id) => !params.courseMetadataIds.includes(id));
		}
		throw new BadRequest('invalid datatype');
	}

	/**
	* 
	* @param {*} params 
	*/
	async obtainMetadata(params) {
		const metaData = await this.app.service('webuntisMetadata').find({
			query: { datasourceId: params.datasourceId },
			paginate: false
		});

		return metaData;
	}

	/**
	* 
	* @param {*} config 
	*/
	async login(config) {
		await super.login(config.url, config.schoolname, config.username, config.password);

		return {
			session: this.session,
			rpc: this.rpc
		};
	}

	/**
	* 
	* @param {*} session
	* @return List of potential courses
	*   Array of {
	*     teacher: 'Renz',
	*     class: [ '2a', '2b' ],
	*     subject: 'mathe',
	*     times: [ { weekDay, startTime, endTime, room } ],
	*     state: 'new',
	*   }
	*/
	async fetchMetaData(session) {
		const intermediateData = {};
		
		intermediateData.currentSchoolYear = await this.getCurrentSchoolyear();

		// To iterate over either concept
		intermediateData.classes = await this.getClasses(intermediateData.currentSchoolYear.id);
		intermediateData.teachers = await this.getTeachers();
		intermediateData.rooms = await this.getRooms();
		// intermediateData.subjects = await this.getSubjects(); // currently not required

		// intermediateData.timeGrid = await this.getTimegrid(); // currently not required

		// Initialize empty timetable for classes
		for (let entry of intermediateData.classes) {
			entry.timetable = [];
		}

		const result = [];

		// Iteration approaches currently implemented: teachers and rooms
		if (intermediateData.teachers !== undefined) { // Iterate over teachers
			for (const teacher of intermediateData.teachers) {
				const name = `${teacher.foreName} ${teacher.longName}`;

				let timetable = await this.getCustomizableTimeTableFor(2, teacher.id, {
					startDate: intermediateData.currentSchoolYear.startDate,
					endDate: intermediateData.currentSchoolYear.endDate,
					onlyBaseTimetable: true,
					klasseFields: ['id', 'longname'],
					subjectFields: ['id', 'longname'],
					roomFields: ['id', 'longname'],
				});

				/* TODO: Check for change */
				const filteredTimetable = timetable.filter(entry => !(entry.te.length === 1
					&& entry.te[0].id === teacher.id
					&& entry.kl.length > 0
					&& entry.ro.length === 1
					&& entry.su.length === 1));
				if (filteredTimetable.length > 0) {
					this.logger.warn(`Ignored timetable entries from WebUntis import`, { ignored: filteredTimetable });
				}

				timetable = timetable.filter(entry => entry.te.length === 1
					&& entry.te[0].id === teacher.id
					&& entry.kl.length > 0
					&& entry.ro.length === 1
					&& entry.su.length === 1);
				/* END TODO: Check for change */
	
				for (const entry of timetable) {
					for (const classEntry of entry.kl) {
						const klass = intermediateData.classes.find(k => k.id === classEntry.id);
	
						if (klass !== undefined) {
							klass.timetable.push({
								date: entry.date,
								startTime: entry.startTime,
								endTime: entry.endTime,
								teacher: name,
								subject: entry.su[0].longname,
								room: entry.ro[0].longname,
							});
						}
					}
				}
			}
		} else if (intermediateData.rooms !== undefined) { // Iterate over rooms
			for (const room of intermediateData.rooms) {
				const name = `${room.name} (${room.longName}${room.building !== '' ? `, ${room.building}` : ''})`;

				let timetable = await this.getCustomizableTimeTableFor(4, room.id, {
					startDate: intermediateData.currentSchoolYear.startDate,
					endDate: intermediateData.currentSchoolYear.endDate,
					onlyBaseTimetable: true,
					klasseFields: ['id', 'longname'],
					subjectFields: ['id', 'longname'],
					teacherFields: ['id', 'longname'],
				});

				/* TODO: Check for change */
				const filteredTimetable = timetable.filter(entry => !(entry.ro.length === 1
					&& entry.ro[0].id === room.id
					&& entry.kl.length > 0
					&& entry.te.length === 1
					&& entry.su.length === 1));
				if (filteredTimetable.length > 0) {
					this.logger.warn(`Ignored timetable entries from WebUntis import`, { ignored: filteredTimetable });
				}

				timetable = timetable.filter(entry => entry.ro.length === 1
					&& entry.ro[0].id === room.id
					&& entry.kl.length > 0
					&& entry.te.length === 1
					&& entry.su.length === 1);
				/* END TODO: Check for change */
	
				for (const entry of timetable) {
					for (const classEntry of entry.kl) {
						const klass = intermediateData.classes.find(k => k.id === classEntry.id);
	
						if (klass !== undefined) {
							klass.timetable.push({
								date: entry.date,
								startTime: entry.startTime,
								endTime: entry.endTime,
								teacher: entry.te[0].longname,
								subject: entry.su[0].longname,
								room: name,
							});
						}
					}
				}
			}
		} else {
			throw new NotImplemented(`Iteration over WebUntis data must be either teachers or rooms.`);
		}

		// Collect times for each class
		// TODO: filter time slots for non-existing Schul-Cloud classes?
		for (let klass of intermediateData.classes) {
			const times = [];
			for (const timetableEntry of klass.timetable) {
				const newEntry = {
					teacher: timetableEntry.teacher,
					subject: timetableEntry.subject,
					weekday: this.getWeekDay(timetableEntry.date),
					startTime: this.getStartTime(timetableEntry.startTime),
					duration: this.getDuration(timetableEntry.startTime, timetableEntry.endTime),
					room: timetableEntry.room,
					count: 1,
				};
				let entryFound = false;
				for (const givenEntry of times) {
					if (givenEntry.weekday === newEntry.weekday
						&& givenEntry.startTime === newEntry.startTime
						&& givenEntry.duration === newEntry.duration
						&& givenEntry.room === newEntry.room) {
						givenEntry.count += 1;
						entryFound = true;
					}
				}
				if (!entryFound) {
					times.push(newEntry);
				}
			}

			// Assumption: After 2 entries it is recurring
			const filteredTimes = times.filter(entry => entry.count >= 2);

			for (let timeEntry of filteredTimes) {
				const newEntry = {
					teacher: timeEntry.teacher,
					class: klass.longName, // note uppercase N here!
					times: [ {
						weekday: timeEntry.weekday,
						startTime: timeEntry.startTime,
						duration: timeEntry.duration,
						room: timeEntry.room,
					} ],
					subject: timeEntry.subject,
					state: 'new',
				};

				let entryFound = false;
				for (const givenEntry of result) {
					if (givenEntry.teacher === newEntry.teacher
						&& givenEntry.class === newEntry.class
						&& givenEntry.subject === newEntry.subject) {
						givenEntry.times.push(newEntry.times[0]);
						entryFound = true;
					}
				}
				if (!entryFound) {
					result.push(newEntry);
				}
			}
		}

		return result;
	}

	/**
	* 
	* @param {*} session 
	* @param {*} metaData 
	*/
	async fetchData(session, metaData) {
		// Not required as all information are fetched during phase 1

		return metaData;
	}

	/**
	* 
	* @param {*} session 
	*/
	async logout(session) {
		await super.logout();
	}

	/**
	* 
	* @param {*} metadata 
	*/
	async storeMetadata(metaData, params) {
		const webUntisMetadataService = this.app.service('webuntisMetadata');

		await Promise.all(metaData.map(async (entry) => {
			const metadataResults = await webUntisMetadataService.find({ query: {
				datasourceId: params.datasourceId,
				teacher: entry.teacher,
				class: entry.class,
				subject: entry.subject
			}, paginate: false });
			const result = metadataResults[0];

			if (result !== undefined) { // patch/replace existing
				await webUntisMetadataService.patch(result._id, { state: entry.state, times: entry.times });
			} else { // create new
				await webUntisMetadataService.create(Object.assign(
					{ datasourceId: params.datasourceId },
					entry
				));
			}
		}));
	}

	/**
	* 
	* @param {*} data 
	*/
	async createCourses(config, data, params) {
		// Convert metadata to actual schulcloud courses
		// And reflect changes in metadata store
		const webUntisMetadataService = this.app.service('webuntisMetadata');

		const importCondition = this.getImportConditionEvaluator(params);

		for (let entry of data) {
			if (importCondition(entry._id.toString())) {
				await this.obtainAndUpdateCourseAndClass(config, entry)
					.then(() => webUntisMetadataService.patch(entry._id, { state: 'imported' }))
					// .catch(() => webUntisMetadataService.patch(entry._id, { state: 'errored' }));
					;
			} else {
				await webUntisMetadataService.patch(entry._id, { state: 'discarded' });
			}
		}
	}

	/**
	* Entry: {
	*    datasourceId: this.data.datasourceId,
	*    teacher: 'Renz',
	*    class: '2a',
	*    times: [ { weekDay, startTime, endTime, room }],
	*    subject: 'mathe',
	*    state: 'new',
	* }
	*/
	async obtainAndUpdateCourseAndClass(config, entry) {
		const courseService = this.app.service('courses');
		const classService = this.app.service('classes');

		const user = await this.getUser();

		const school = await this.getSchool(user);

		/**
        * Mapping:
        *
        * Schul-Cloud: class, course (per class), lesson
        * WebUntis: class, subject
        * German: Klasse, Kurs, Fach, Schulstunde
        */

		// Get class
		const scClasses = await classService.find({ query: { name: entry.class }, paginate: false });

		let scClass = scClasses.length >= 1 ? scClasses[0] : undefined;
		if (scClass === undefined) {
			// Create Schul-Cloud class?

			// TODO: extract gradeLevel

			const newClass = {
				name: entry.class,
				schoolId: school._id,
				nameFormat: 'static',
				year: school.currentYear,
			};
			scClass = await classService.create(newClass);

			// TODO: derive successor value for predecessor class?
		}

		// Extract class short name
		const shortClassName = scClass.name.match(/[A-Za-z]{1}[0-9]{1,2}[A-Za-z]{1}/g) || scClass.name.substr(0, 3).replace( /^\s+|\s+$/g, '' );
		const courseName = entry.subject + ` ` + shortClassName;

		// Get course
		const scCourses = await courseService.find({
			// TODO: use teacher is query value, too
			query: {
				name: entry.subject,
				schoolId: school._id,
			},
			paginate: false,
		});

		let scCourse = scCourses.length >= 1 ? scCourses[0] : undefined;
		if (scCourse === undefined) {
			// Create Course
			const newCourse = {
				name: courseName,
				teacherIds: [user._id],
				classIds: [],
				schoolId: school._id,
			};

			scCourse = await courseService.create(newCourse);
		}

		// Update course by merging information
		const courseUpdate = {};

		// Update classes; add new class
		if (!scCourse.classIds.some((entry) => entry.toString() === scClass.id)) {
			courseUpdate.classIds = scCourse.classIds;
			courseUpdate.classIds.push(scClass._id);
		}

		// Update times; overwrite
		courseUpdate.times = entry.times;

		// TODO: derive startDate
		// TODO: derive endDate

		// Indicate import status
		if (scCourse.source === undefined) {
			courseUpdate.source = 'webuntis';
			courseUpdate.sourceOptions = {
				schoolname: config.schoolname,
				courseName: entry.subject,
			};
		}

		await courseService.patch(scCourse._id, courseUpdate, { account: { userId: user._id }});
	}
}

module.exports = {
	WebUntisSchoolyearSyncer
};
