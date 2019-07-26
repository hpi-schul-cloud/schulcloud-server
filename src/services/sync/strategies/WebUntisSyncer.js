const Syncer = require('./Syncer');

const Lesson = require('../../services/lesson/model');

const WebUntisApi = require('../../webuntis/services/WebUntisApi');

/**
 * Implements syncing from WebUntis API based on the Syncer interface
 * @class WebUntisSyncer
 * @implements {Syncer}
 */
class WebUntisSyncer extends Syncer {

	constructor(app, stats) {
		super(app, stats);
		Object.assign(this.stats, {
			systems: {},
		});
	}

	/**
	 * @see {Syncer#respondsTo}
	 */
	static respondsTo(target) {
		return target === 'webuntis';
	}

	static params(params, data) {
		return [true];
	}

	/**
	 * @see {Syncer#steps}
	 */
	steps() {
        /* Why not
        return this.getWebUntisSystems().then(
            systems => {
                // ...
            }
        );
        ? */
		return super.steps()
			.then(() => this.getWebUntisSystems())
			.then(systems => {
				return Promise.all(systems.map(system => {
					this.stats.systems[system.alias] = {};
					return this.syncFromSystem(system, this.stats.systems[system.alias], this.app);
				}));
			});
	}

	async getWebUntisSystems() {
        // { query: { type: 'webuntis', 'webuntisConfig.active': true } }
		return this.app.service('systems').find({ query: { type: 'webuntis' }, paginate: false })
			.then((systems) => {
				this.logInfo(`Found ${systems.length} WebUntis configurations.`);
				return systems;
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
        // const students = await api.getStudents();
		// const teachers = await api.getTeachers();
        const classes = await api.getClasses();
        
        stats.classes = [];
        for (let klass of classes) {
            klass.timetable = await api.getTimetableForClass(klass.id);
            stats.classes.push(klass);
        }

        /*return Promise.all([
            api.getStudents()
                .then((students) => {
                    stats.students = students;
                }),
            api.getTeachers()
                .then((teachers) => {
                    stats.teachers = teachers;
                }),
            api.getClasses()
                .then((classes) => {
                    stats.classes = classes;
                })
        ]);*/
    }
}

module.exports = WebUntisSyncer;
