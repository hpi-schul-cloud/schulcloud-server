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

		const dryrun = !("dryrun" in params) || (params.dryrun !== 'false' && params.dryrun !== false);

		const query = (params || {}).query || {}; // object containing url, username, password, and schoolname

		const validQuery = (
			query.username != '' &&
			query.url != '' &&
			query.password != '' &&
			query.schoolname != ''
		);
		
		let validData = false;
		if (dryrun) {
			validData = (
				data.datasourceId != ''
			);
		} else {
			validData = (
				['inclusive', 'exclusive'].includes(data.data.type) || (!data.type && !data.data.courseMetadataIds) &&
				data.datasourceId != ''
			);
		}
		

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
			datatype: ((data || {}).data || {}).type,
			courseMetadataIds: data.data.courseMetadataIds,
			dryrun: dryrun,
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

		await this.login(config.url, config.schoolname, config.username, config.password);
		const metaData = await this.fetchMetaData(params);
		await this.logout();
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
		// await this.login(config.url, config.schoolname, config.username, config.password);
		
		const data = await this.fetchData(metaData);

		// await this.logout();

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
	* @return List of potential courses
	*   Array of {
	*     teacher: 'Renz',
	*     class: [ '2a', '2b' ],
	*     subject: 'mathe',
	*     times: [ { weekDay, startTime, endTime, room } ],
	*     state: 'new',
	*   }
	*/
	async fetchMetaData() {
		const intermediateData = {};
		
		intermediateData.currentSchoolYear = await this.getCurrentSchoolyear();

		// To iterate over either concept
		intermediateData.classes = await this.getClasses(intermediateData.currentSchoolYear.id);
		intermediateData.teachers = await this.getTeachers();
		intermediateData.rooms = await this.getRooms();
		// intermediateData.subjects = await this.getSubjects(); // currently not required

		// intermediateData.timeGrid = await this.getTimegrid(); // currently not required

		intermediateData.courses = [];

		// Iteration approaches currently implemented: teachers
		if (intermediateData.teachers !== undefined) { // Iterate over teachers
			for (const teacher of intermediateData.teachers) {
				const currentTeacherName = `${teacher.foreName} ${teacher.longName}`;

				let timetable = await this.getCustomizableTimeTableFor(2, teacher.id, {
					startDate: intermediateData.currentSchoolYear.startDate,
					endDate: intermediateData.currentSchoolYear.endDate,
					onlyBaseTimetable: true,
					klasseFields: ['id', 'longname'],
					subjectFields: ['id', 'longname'],
					roomFields: ['id', 'longname'],
					teacherFields: ['id', 'longname'],
				});

				/* TODO: Check for change */
				let filteredTimetable = timetable.filter(entry => !(entry.te.length === 1
					&& entry.te[0].id === teacher.id
					&& entry.kl.length > 0
					&& entry.ro.length === 1
					&& entry.su.length === 1));
				if (filteredTimetable.length > 0) {
					filteredTimetable = filteredTimetable.map(entry => {
						return {
							teachers: entry.te.map(teacher => teacher.longname),
							teacherValid: entry.te[0].id === teacher.id,
							rooms: entry.ro.map(room => room.longname),
							roomValid: entry.ro.length === 1,
							classes: entry.kl.map(klass => klass.longname),
							classesValid: entry.kl.length > 0,
							subjects: entry.su.map(subject => subject.longname),
							subjectValid: entry.su.length === 1
						};
					});
					this.logger.warning(`Ignored timetable entries from WebUntis import`, { ignored: filteredTimetable });
				}

				timetable = timetable.filter(entry => entry.te.length === 1
					&& entry.te[0].id === teacher.id
					&& entry.kl.length > 0
					&& entry.ro.length === 1
					&& entry.su.length === 1);
				/* END TODO: Check for change */

				const compareArraysOfString = (a1, a2) => {
					if (a1.length !== a2.length) {
						return false;
					}

					for (let i = 0; i < a1.length; ++i) {
						if (a1[i] !== a2[i]) {
							return false;
						}
					}

					return true;
				};
	
				for (const entry of timetable) {
					const classNames = entry.kl.map(k => k.longname);

					// Select course with matching teacher, subject, and participating classes
					let course = intermediateData.courses.find(course => {
						return course.teacher === currentTeacherName &&
							course.subject === entry.su[0].longname &&
							compareArraysOfString(course.classes, classNames);
					});

					if (course === undefined) { // Create course
						course = {
							teacher: currentTeacherName,
							subject: entry.su[0].longname,
							classes: classNames,
							timetable: []
						};
						intermediateData.courses.push(course);
					}
					
					// Update timetable of course
					course.timetable.push({
						date: entry.date,
						startTime: entry.startTime,
						endTime: entry.endTime,
						room: entry.ro[0].longname,
					});

					// Update first and last date of course
					if (course.startDate === undefined || course.startDate > entry.date) {
						course.startDate = entry.date;
					}
					if (course.endDate === undefined || course.endDate < entry.date) {
						course.endDate = entry.date;
					}
				}
			}
		} else if (intermediateData.rooms !== undefined) { // Iterate over rooms
			for (const room of intermediateData.rooms) {
				const currentRoomName = `${room.name} (${room.longName}${room.building !== '' ? `, ${room.building}` : ''})`;

				let timetable = await this.getCustomizableTimeTableFor(4, room.id, {
					startDate: intermediateData.currentSchoolYear.startDate,
					endDate: intermediateData.currentSchoolYear.endDate,
					onlyBaseTimetable: true,
					klasseFields: ['id', 'longname'],
					subjectFields: ['id', 'longname'],
					teacherFields: ['id', 'longname'],
					roomFields: ['id', 'longname'],
				});

				/* TODO: Check for change */
				let filteredTimetable = timetable.filter(entry => !(entry.ro.length === 1
					&& entry.ro[0].id === room.id
					&& entry.kl.length > 0
					&& entry.te.length === 1
					&& entry.su.length === 1));
				if (filteredTimetable.length > 0) {
					filteredTimetable = filteredTimetable.map(entry => {
						return {
							teachers: entry.te.map(teacher => teacher.longname),
							teacherValid: entry.te.length === 1,
							rooms: entry.ro.map(room => room.longname),
							roomValid: entry.ro.length === 1 &&  entry.ro[0].id === room.id,
							classes: entry.kl.map(klass => klass.longname),
							classesValid: entry.kl.length > 0,
							subjects: entry.su.map(subject => subject.longname),
							subjectValid: entry.su.length === 1
						};
					});
					this.logger.warning(`Ignored timetable entries from WebUntis import`, { ignored: filteredTimetable });
				}

				timetable = timetable.filter(entry => entry.ro.length === 1
					&& entry.ro[0].id === room.id
					&& entry.kl.length > 0
					&& entry.te.length === 1
					&& entry.su.length === 1);
				/* END TODO: Check for change */

				const compareArraysOfString = (a1, a2) => {
					if (a1.length !== a2.length) {
						return false;
					}

					for (let i = 0; i < a1.length; ++i) {
						if (a1[i] !== a2[i]) {
							return false;
						}
					}

					return true;
				};
	
				for (const entry of timetable) {
					const classNames = entry.kl.map(k => k.longname);

					// Select course with matching teacher, subject, and participating classes
					let course = intermediateData.courses.find(course => {
						return course.teacher === entry.te[0].longname &&
							course.subject === entry.su[0].longname &&
							compareArraysOfString(course.classes, classNames);
					});

					if (course === undefined) { // Create course
						course = {
							teacher: entry.te[0].longname,
							subject: entry.su[0].longname,
							classes: classNames,
							timetable: []
						};
						intermediateData.courses.push(course);
					}
					
					// Update timetable of course
					course.timetable.push({
						date: entry.date,
						startTime: entry.startTime,
						endTime: entry.endTime,
						room: currentRoomName,
					});

					// Update first and last date of course
					if (course.startDate === undefined || course.startDate > entry.date) {
						course.startDate = entry.date;
					}
					if (course.endDate === undefined || course.endDate < entry.date) {
						course.endDate = entry.date;
					}
				}
			}
		} else {
			throw new NotImplemented(`Iteration over WebUntis data must be teachers or rooms.`);
		}

		const result = [];

		// Collect times for each course
		// TODO: filter time slots for non-existing Schul-Cloud classes?
		for (let course of intermediateData.courses) {
			const times = [];
			for (const timetableEntry of course.timetable) {
				const newEntry = {
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

			result.push({
				teacher: course.teacher,
				classes: course.classes,
				subject: course.subject,
				times: filteredTimes,
				state: 'new'
			});
		}

		return result;
	}

	/**
	* 
	* @param {*} metaData 
	*/
	async fetchData(metaData) {
		// Not required as all information are fetched during phase 1

		return metaData;
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
				classes: entry.classes,
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
	*     datasourceId: this.data.datasourceId,
	*     teacher: 'Renz',
	*     class: [ '2a', '2b' ],
	*     subject: 'mathe',
	*     times: [ { weekDay, startTime, endTime, room } ],
	*     state: 'new',
	*   }
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

		// Get classes
		const scClasses = await Promise.all(entry.classes.map(async (className) => {
			const classes = await classService.find({ query: { name: className }, paginate: false });

			let scClass = classes.length >= 1 ? classes[0] : undefined;
			if (scClass === undefined) {
				// Create Schul-Cloud class?

				// TODO: extract gradeLevel

				const newClass = {
					name: className,
					schoolId: school._id,
					nameFormat: 'static',
					year: school.currentYear,
				};
				scClass = await classService.create(newClass);

				// TODO: derive successor value for predecessor class?
			}

			return scClass;
		}));

		// Extract class short name
		const shortClassNames = scClasses.map((k) => {
			const className = k.name;
			const shortClassName = className.match(/[A-Za-z]{1}[0-9]{1,2}[A-Za-z]{1}/g)
				|| className.substr(0, 3).replace( /^\s+|\s+$/g, '' );
			return shortClassName;
		});
		const courseName = entry.subject + ` (` + shortClassNames.join(`, `) + `)`;

		// Get course
		const scCourses = await courseService.find({
			// TODO: use teacher as query value, too
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
		courseUpdate.classIds = scCourse.classIds;
		for (let scClass of scClasses) {
			if (scCourse.classIds.every((entry) => entry.toString() !== scClass.id)) {
				courseUpdate.classIds.push(scClass._id);
			}
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
				teacherName: entry.teacher,
				classNames: entry.classes.join(', ')
			};
		}

		// 'courses' service requires authorization for patching
		await courseService.patch(scCourse._id, courseUpdate, { account: { userId: user._id }});
	}
}

module.exports = {
	WebUntisSchoolyearSyncer
};
