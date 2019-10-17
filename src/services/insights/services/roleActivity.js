const request = require('request-promise-native');
const hooks = require('../hooks');

function dataMassager(cubeJsData) {
	const parsed = JSON.parse(cubeJsData);
	const teacherData = parsed.data[0] ? parsed.data[0]['Events.count'] : null;
	const studentData = parsed.data[1] ? parsed.data[1]['Events.count'] : null;

	const data = {
		teacherData,
		studentData,
	};
	return data;
}

function generateUrl(schoolId) {
	const cubeJsUrl = process.env.INSIGHTS_CUBEJS || 'http://localhost:4000/cubejs-api/v1/';
	const query = `load?query={
  "measures": [
    "Events.count"
  ],
  "timeDimensions": [
    {
      "dimension": "Events.timeStamp",
      "dateRange": "Last 30 days"
    }
  ],
  "dimensions": [
    "Actor.roles"
  ],
  "segments": [
    "Actor.lehrerSchueler"
  ],
  "filters": [
    {
      "dimension": "Actor.school_id",
      "operator": "contains",
      "values": ["${schoolId}"]
    }
  ]
}`;
	return `${cubeJsUrl}${query}`;
}


class RoleActivity {
	async find(data, params) {
		const checkForHexRegExp = /^[a-f\d]{24}$/i;
		if (!data.query || !data.query.schoolId || !checkForHexRegExp.test(data.query.schoolId)) {
			return 'query required: "schoolId" (ObjectId)';
		}
		const { schoolId } = data.query;
		const options = {
			url: generateUrl(schoolId),
			method: 'GET',
		};
		const cubeJsData = await request(options);
		const result = dataMassager(cubeJsData);

		return result;
	}
}

module.exports = (app) => {
	const insightRoute = '/insights/roleActivity';
	app.use(insightRoute, new RoleActivity());
	const insightsService = app.service('/insights/roleActivity');
	insightsService.hooks(hooks);
};
