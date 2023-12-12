const request = require('request-promise-native');

const { Configuration } = require('@hpi-schul-cloud/commons');
const hooks = require('./hooks');

const calendarUri = Configuration.get('CALENDAR_URI');
class CourseCalendarService {
	constructor(app) {
		this.app = app;
	}

	remove(id, params) {
		const userId = (params.query || {}).userId || (params.account || {}).userId || params.payload.userId;
		const options = {
			uri: `${calendarUri}/scopes/${id}`,
			headers: {
				Authorization: userId,
			},
			json: true,
			method: 'DELETE',
			timeout: Configuration.get('REQUEST_OPTION__TIMEOUT_MS'),
			body: { data: [{ type: 'event' }] },
		};

		return request(options).then((res) => {
			// calendar returns nothing if event was successfully deleted
			if (!res) return { message: 'Successful deleted event' };
			return res;
		});
	}
}

module.exports = function setup(app) {
	app.use('/calendar/courses', new CourseCalendarService(app));
	const courseCalendarService = app.service('/calendar/courses');
	courseCalendarService.hooks(hooks);
};
