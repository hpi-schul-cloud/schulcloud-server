const request = require('request-promise-native');

const { Configuration } = require('@hpi-schul-cloud/commons');
const hooks = require('./hooks');

class CourseCalendarService {
	constructor(app) {
		this.app = app;
	}

	remove(id, params) {
		const serviceUrls = this.app.get('services') || {};

		const userId = (params.query || {}).userId || (params.account || {}).userId || params.payload.userId;
		const options = {
			uri: `${serviceUrls.calendar}/scopes/${id}`,
			headers: {
				Authorization: userId,
			},
			json: true,
			method: 'DELETE',
			timeout: Configuration.get('REQUEST_TIMEOUT'),
			body: { data: [{ type: 'event' }] },
		};

		return request(options).then((res) => {
			// calendar returns nothing if event was successfully deleted
			if (!res) return { message: 'Successful deleted event' };
			return res;
		});
	}
}

module.exports = CourseCalendarService;

module.exports = function setup() {
	const app = this;

	app.use('/calendar-course', new CourseCalendarService(app));
	const courseCalendarService = app.service('/calendar-course');
	courseCalendarService.hooks(hooks);
};
