const request = require('request-promise-native');
const hooks = require('../hooks');
const { userModel } = require('../../user/model');

function dataMassager(cubeJsData, totalUsers) {
	const parsed = JSON.parse(cubeJsData);

	// filtering out the roles from mongodb
	const teacherUsers = totalUsers[0] ? totalUsers[0].roles.filter((el) => el.name === 'teacher').length : null;
	// const studentUsers = totalUsers[0] ? totalUsers[0].roles.filter((el) => el.name === 'student').length : null;
	const studentUsers = 102;

	// grabbing the active users from cubejs or null
	const activeStudents = parsed.data[0] ? parsed.data[0]['Events.activeUsers'] : null;
	const activeTeachers = parsed.data[1] ? parsed.data[1]['Events.activeUsers'] : null;

	// converting to percentage or NaN.
	// two decimals
	const activeStudentPercentage = (Number(activeStudents) / studentUsers * 100).toFixed(2);
	const activeTeacherPercentage = (Number(activeTeachers) / teacherUsers * 100).toFixed(2);

	const data = {
		teacherUsers,
		studentUsers,
		activeStudents,
		activeTeachers,
		activeStudentPercentage,
		activeTeacherPercentage,
	};
	return data;
}

function generateUri() {
	const cubeJsUri = 'http://localhost:4000/cubejs-api/v1/load?';
	const query = `query={
        "measures": [
          "Events.activeUsers"
        ],
        "timeDimensions": [
          {
            "dimension": "Events.timeStamp",
            "dateRange": "Last 7 days"
          }
        ],
        "filters": [
          {
            "dimension": "Actor.school_id",
            "operator": "contains",
            "values": []
          }
        ],
        "dimensions": [
          "Actor.roles"
        ],
        "segments": [
          "Actor.lehrerSchueler"
        ]
      }`;


	return `${cubeJsUri}${query}`;
}


class WeeklyActiveUsers {
	async find(data, params) {
		const options = {
			uri: generateUri(),
			method: 'GET',
		};
		const cubeJsData = await request(options);

		const totalUsers = await userModel.find({})
			.select('roles')
			.populate('roles');

		const result = dataMassager(cubeJsData, totalUsers);

		return result;
	}
}

module.exports = (app) => {
	const insightRoute = '/insights/weeklyActiveUsers';
	app.use(insightRoute, new WeeklyActiveUsers());
	const insightsService = app.service('/insights/weeklyActiveUsers');
	insightsService.hooks(hooks);
};
