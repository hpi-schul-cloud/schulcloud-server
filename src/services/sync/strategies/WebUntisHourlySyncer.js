const Syncer = require('./Syncer');

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
			.then(systems => {
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
					return this.syncFromSystem(system, this.stats.systems[system.alias], this.app);
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
                return school.systems.filter(system => system.type == 'webuntis');
            });
    }

    async syncFromSystem(system, stats, app) {
        var api = new WebUntisApi(
            system.webuntisConfig.url,
            system.webuntisConfig.schoolname
        );

        return Promise.resolve()
            .then(() => api.login(
                system.webuntisConfig.user,
                system.webuntisConfig.password
            ))
            .then(() => this.syncFromAPI(api, stats, app))
            .then(() => {
                stats.success = true;
                api.logout();
            });
    }

    async syncFromAPI(api, stats, app) {
        let data = {};
        data.currentSchoolYear = await api.getCurrentSchoolyear();
        // data.holidays = await api.getHolidays();
        // data.subjects = await api.getSubjects(); // Ignore subjects for now
        data.timeGrid = await api.getTimegrid();
        data.classes = await api.getClasses(data.currentSchoolYear.id);
        data.rooms = await api.getRooms();

        // stats.holidayRanges = data.holidays.map(holiday => [ holiday.startDate, holiday.endDate ]);
        stats.classes = data.classes.map(klass => {
            return {
                "id": klass.id,
                "name": klass.longName,
                "timetable": []
            };
        });
        stats.timeGrid = data.timeGrid.map(day => {
            return {
                "day": api.dayLookUp(day.day),
                "timeUnits": day.timeUnits
            }
        });

        data.rooms = data.rooms.map(room => { return {
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
                    let klass = stats.classes.find(k => {
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

        return Promise.resolve();
    }
}

module.exports = WebUntisHourlySyncer;
