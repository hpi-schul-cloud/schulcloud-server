const Syncer = require('./Syncer');

const assert = require('assert');

const Lesson = require('../../lesson/model');
const { userModel: User } = require('../../user/model');
const { schoolModel: School, yearModel: Year } = require('../../school/model');

const WebUntisApi = require('../../webuntis/services/WebUntisApi');

/**
 * Implements syncing from WebUntis API based on the Syncer interface
 * @class WebUntisSyncer
 * @implements {Syncer}
 */
class WebUntisHourlySyncer extends Syncer {

	constructor(app, stats, account) {
        super(app, stats);
        this.account = account;
		Object.assign(this.stats, {
			systems: {},
		});
	}

	/**
	 * @see {Syncer#respondsTo}
	 */
	static respondsTo(target) {
		return target === 'webuntis-hourly';
	}

	static params(params, data) {
		return [params.account];
	}

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
        /* Why not
        return this.getWebUntisSystems().then(
            systems => {
                // ...
            }
        );
        ? */
        return this.getUser()
            .then(user => this.getWebUntisSystems(user))
			.then((systems, school) => {
                /* TODO: Remove later */
                if (systems.length === 0) {
                    /*systems[0] = {
                        "webuntisConfig": {
                            "active": true,
                            "url": "https://demo.webuntis.com",
                            "schoolname": "demo_inf",
                            "user": "api",
                            "password": "api"
                        },
                    };*/
                    systems[0] = {
                        "alias": "Test WebUntis",
                        "type": "webuntis",
                        "webuntisConfig": {
                            "active": true,
                            "url": "https://erato.webuntis.com",
                            "schoolname": "ES_Frankfurt",
                            "user": "hpi",
                            "password": "Hpi.01"
                        },
                    };
                }

                if (systems.length === 0) {
                    return Promise.reject(
                        new Error('No WebUntis configuration for associated school.')
                    );
                }
                this.logInfo(`Found ${systems.length} WebUntis configurations.`);
				return Promise.all(systems.map(system => {
					this.stats.systems[system.alias] = {};
					return this.syncFromSystem(system, this.stats.systems[system.alias], this.app, school);
				}));
			});
    }
    
    async getUser() {
        return this.app.service('users').get(this.account.userId);
    }

	async getWebUntisSystems(user) {
        this.logInfo(`Get Systems for user ${user}, ${user.id}, ${user.schoolId}.`);
        return this.app.service('schools').get(user.schoolId)
            .then((school) => {
                return Promise.all(
                    school.systems.filter(system => system.type == 'webuntis'),
                    school
                );
            });
    }

    async syncFromSystem(system, stats, app, school) {
        var api = new WebUntisApi(
            system.webuntisConfig.url,
            system.webuntisConfig.schoolname
        );

        return api.login(system.webuntisConfig.user, system.webuntisConfig.password)
            .then(() => this.fetchInformation(api, stats, app))
            .then((data) => {
                api.logout();
                return Promise.resolve(data)
            })
            .then((data) => {
                this.migrateData(data, stat, school);
            })
            .then(() => {
                stats.success = true;
            });
    }

    async fetchInformation(api, stats, app) {
        let intermediateData = {};
        let data = {};
        data.currentSchoolYear = await api.getCurrentSchoolyear();
        // intermediateData.holidays = await api.getHolidays();
        // data.subjects = await api.getSubjects(); // Ignore subjects for now
        intermediateData.timeGrid = await api.getTimegrid();
        intermediateData.classes = await api.getClasses(data.currentSchoolYear.id);
        intermediateData.rooms = await api.getRooms();

        // data.holidayRanges = data.holidays.map(holiday => [ holiday.startDate, holiday.endDate ]);
        data.classes = intermediateData.classes.map(klass => {
            return {
                "id": klass.id,
                "name": klass.longName,
                "timetable": []
            };
        });
        data.timeGrid = intermediateData.timeGrid.map(day => {
            return {
                "day": api.dayLookUp(day.day),
                "timeUnits": day.timeUnits
            }
        });

        data.rooms = intermediateData.rooms.map(room => { return {
            "id": room.id,
            "name": room.name + " (" + room.longName + (room.building !== "" ? ", " + room.building : "") + ")"
        }; });
        
        for (let index in data.rooms) {
            let timetable = await api.getCustomizableTimeTableFor(4, data.rooms[index].id, {
                "startDate": data.currentSchoolYear.startDate,
                "endDate": data.currentSchoolYear.endDate,
                "onlyBaseTimetable": true,
                "klasseFields": [ "id", "longname" ],
                "subjectFields": [ "id", "longname" ],
                "teacherFields": [ "id", "longname" ]
            });
            timetable = timetable.filter(entry => 
                entry.ro.length === 1 &&
                entry.ro[0].id === data.rooms[index].id &&
                entry.kl.length > 0 &&
                entry.te.length === 1 &&
                entry.su.length === 1
            );

            for (let entryIndex in timetable) {
                let entry = timetable[entryIndex];
                for (let klassIndex in entry.kl) {
                    let klass = data.classes.find(k => {
                        return k.id === entry.kl[klassIndex].id;
                    });

                    if (klass === undefined) {
                        continue;
                    }

                    klass.timetable.push({
                        "date": entry.date,
                        "startTime": entry.startTime,
                        "endTime": entry.endTime,
                        "teacher": entry.te[0].longname,
                        "subject": entry.su[0].longname,
                        "room": data.rooms[index].name
                    });
                }
            }
        }

        return Promise.resolve(data);
    }

    async migrateData(data, stats, school) {
		const courseService = this.app.service('courses');
		const classService = this.app.service('classes');
        /**
         * Mapping:
         * 
         * Schul-Cloud: class, course (per class), lesson
         * WebUntis: class, subject
         * German: Klasse, Kurs, Fach, Schulstunde
         */

        for (let classIndex in data.classes) {
            /**
             * Obtain classes
             */
            const klass = data.classes[classIndex];
            const className = klass.id;
            const scClasses = await classService.find({ query: { name: klass.longname }, paginate: false });

            let scClass = undefined;
            if (scClasses.total === 0) {
                // Create Schul-Cloud class?
                const newClass = {
					name: className,
					schoolId: school._id,
					nameFormat: 'static',
					year: school.currentYear,
				};
                scClass = await classService.create(newClass);
            } else {
                scClass = scClasses[0];
            }

            const courses = {};
            const times = {};
            for (let timetableIndex in klass.timetable) {
                const timetableEntry = klass.timetable[timetableIndex];

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
                    const courseName = subjectName + scClass.name;
                    scCourses = await courseService.find({ query: {
                        name: courseName,
                        classIds: scClass._id,
                        schoolId: school._id
                    }, paginate: false });

                    if (scCourses.total === 0) {
                        // Create Course
                        newCourse = {
                            name: courseName,
                            classIds: [ scClass._id ],
                            schoolId: school._id,
                            teacherIds: [ /* TODO: user id */ ],
                        };

                        scCourse = await courseService.create(newCourse);
                        courses[subjectName] = scCourse;
                        times[subjectName] = [];
                    } else {
                        scCourse = scCourses[0];
                    }
                }
                
                const newEntry = {
                    weekday: this.getWeekDay(timetableEntry.date),
                    startTime: this.getStartTime(timetableEntry.startTime),
                    duration: this.getDuration(timetableEntry.startTime, timetableEntry.endTime),
                    room: timetableEntry.room,
                    count: 1
                };
                let entryFound = false;
                for (index in times[subjectName]) {
                    const givenEntry = times[subjectName][index];
                    if (givenEntry.weekday === newEntry.weekday &&
                        givenEntry.startTime === newEntry.startTime &&
                        givenEntry.duration === newEntry.duration &&
                        givenEntry.room === newEntry.room) {
                        givenEntry.count += 1;
                    }
                }
                if (!entryFound) {
                    times[subjectName].push(newEntry);
                }
            }

            for (let subjectName in courses) {
                scCourse = courses[subjectName];
                // Update times, considered are events that occurs at least twice a year
                scCourse.times = times.filter(entry => entry.count >= 2).map(entry => {
                    return {
                        weekday: entry.weekday,
                        startTime: entry.startTime,
                        duration: entry.duration,
                        eventId: undefined,
                        room: entry.room,
                    }
                });
            }
        }

        /** Derive course dates:
         * 
         * Time conversion: int(HHMM) to int(milliseconds)
         * Weekday conversion: int(So-Sa) to int(Mo-So)
        */

        /* Create Calendar Series */

        /* Populate stats */

        return Promise.resolve();
    }

    /**
     * Convert a WebUntis-encoded date to a Schul-Cloud-encoded weekday
     * 
     * @param {int} date - A date encoded in YYYYMMDD
     * 
     * @return Corresponding weekday - from 0 to 6, the weekday the course take place (e.g. 0 = monday, 1 = tuesday ... )
     */
    getWeekDay(date) {
        const jsDate = new Date(
            Math.floor(date / 10000), /* year */
            Math.floor(date / 100) % 100, /* month */
            date % 100, /* day */
            0, /* hour */
            0, /* minute */
            0, /* second */
            0); // remainder
        
        return (jsDate.getDay() + 7 - 1 /* monday offset */) % 7;
    }

    /**
     * Convert a WebUntis-encoded timestamp to a Schul-Cloud-encoded timestamp
     * 
     * @param {int} startTime - A time encoded in HHMM
     * 
     * @return Schul-Cloud-encoded timestamp
     */
    getStartTime(startTime) {
        assert.ok(startTime >= 0);
        assert.ok(startTime < 2400);
        assert.ok(startTime % 100 >= 0);
        assert.ok(startTime % 100 < 60);

        return 1000 /* milliseconds per second */
            * 60 /* seconds per minute */
            * (60 /* minutes per hour */ * Math.floor(startTime / 100)
              + startTime % 100 /* minutes */) /* minutes */;
    }

    /**
     * Convert a WebUntis-encoded start and end timestamp to a Schul-Cloud-encoded duration
     * 
     * @param {int} startTime - A time encoded in HHMM
     * @param {int} endTimeTime  - A time encoded in HHMM
     * 
     * @return Schul-Cloud-encoded duration
     */
    getDuration(startTime, endTime) {
        assert.ok(startTime >= 0);
        assert.ok(startTime < 2400);
        assert.ok(startTime % 100 >= 0);
        assert.ok(startTime % 100 < 60);
        assert.ok(endTime >= 0);
        assert.ok(endTime < 2400);
        assert.ok(endTime % 100 >= 0);
        assert.ok(endTime % 100 < 60);
        assert.ok(endTime >= startTime);

        const durationHours = Math.floor(endTime / 100) - Math.floor(startTime / 100);
        assert.ok(durationHours);
        const durationMinutes = (endTime % 100) - (startTime % 100);
        assert.ok(durationHours > 0 || durationMinutes > 0);
        const duration = durationHours + durationMinutes;

        assert.ok(duration > 0);

        return 1000 /* milliseconds per second */
            * 60 /* seconds per minute */
            * duration/* minutes */;
    }
}

module.exports = WebUntisHourlySyncer;
