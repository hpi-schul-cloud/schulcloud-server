const axios = require('axios');

const { Configuration } = require('@hpi-schul-cloud/commons');
const hooks = require('./hooks');

class CourseCalendarService {
	constructor(app) {
		this.app = app;
	}

	remove(id, params) {
		const userId = (params.query || {}).userId || (params.account || {}).userId || params.payload.userId;
		const options = {
			url: `${Configuration.get('CALENDAR_URI')}/scopes/${id}`,
			method: 'DELETE',
			headers: {
				Authorization: userId,
			},
			timeout: Configuration.get('REQUEST_OPTION__TIMEOUT_MS'),
			data: { data: [{ type: 'event' }] },
		};

		return axios(options).then((res) => {
			// calendar returns nothing if event was successfully deleted
			if (!res.data) return { message: 'Successful deleted event' };
			return res;
		});
	}
}

module.exports = function setup(app) {
	app.use('/calendar/courses', new CourseCalendarService(app));
	const courseCalendarService = app.service('/calendar/courses');
	courseCalendarService.hooks(hooks);
};
