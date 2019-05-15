const WebUntisApi = require('./WebUntisApi');

class WebUntis {
	constructor(options) {
		this.options = options || {};
		this.docs = {
			find: {
				security: [{ bearer: [] }]
			},
			get: {
				security: [{ bearer: [] }]
			},
			create: {
				security: [{ bearer: [] }]
			},
			patch: {
				security: [{ bearer: [] }]
			},
			remove: {
				security: [{ bearer: [] }]
			}
		};
	}
	// https://docs.feathersjs.com/api/services

	async find(params) {	// is get without id in url path
		// example: this.app.service('courses').find({schoolId: '123'})
		// http://localhost:3030/docs/  || https://api.schul-cloud.org/docs/

		// Create WebUntis client
		var webUntis = new WebUntisApi('https://demo.webuntis.com', 'demo_inf');

		// Read classes
		await webUntis.login('api', 'api');
		//const schoolyear = await webUntis.getCurrentSchoolyear();
		//const importTime = await webUntis.getLatestImportTime();
		//const students = await webUntis.getStudents();
		//const teachers = await webUntis.getTeachers();
		//const classes = await webUntis.getClasses();
		//const timegrid = await webUntis.getTimegrid();
		//const status = await webUntis.getStatusData();
		const timetable = await webUntis.getTimetableForClass(229);
		//const substitutions = await webUntis.getSubstitutions(20120101, 20130101);
		//const remarkCategories = await webUntis.getRemarkCategories();
		//const remarkCategoryGroups = await webUntis.getRemarkCategoryGroups();
		//const remarks = await webUntis.getRemarks(20120101, 20190101);
		//const remarks = await webUntis.getRemarksForClass(229, 20120101, 20190101);
		//const examTypes = await webUntis.getExamTypes();
		//const timeTable = await webUntis.getTimetableWithAbsences(20120101, 20190101);
		await webUntis.logout();

		// Return data
		return timetable;
	}

	get(id, params) {
	}

	create(data, params) {
	}

	patch(id, data, params) {
	}

	/*
	update(id, data, params) {
	}
	*/

	remove(id, params) {
	}

	setup(app) {
		this.app = app;
	}
}

module.exports = WebUntis;
