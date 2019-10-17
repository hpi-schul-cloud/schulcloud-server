const request = require('request-promise-native');
const hooks = require('../hooks');

function dataMassager(cubeJsData) {
	const parsed = JSON.parse(cubeJsData);
	const data = {};
	for (const i of parsed.data) {
		data[i['Events.dayOfWeek'].toLowerCase()] = i['Events.count'] || null;
	}
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
    "Events.dayOfWeek"
  ],
  "segments": [],
  "filters": [
    {
		"dimension" : "Actor.school_id",
      "operator": "contains",
      "values": ["${schoolId}"]
    }
  ]
}`;
	return `${cubeJsUrl}${query}`;
}
class WeeklyActivity {
	async find(data, params) {
		const checkForHexRegExp = /^[a-f\d]{24}$/i;
		/* if (!data.query || !data.query.schoolId || !checkForHexRegExp.test(data.query.schoolId)) {
			return 'query required: "schoolId" (ObjectId)';
		} */
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
	const insightRoute = '/insights/weeklyActivity';
	app.use(insightRoute, new WeeklyActivity());
	const insightsService = app.service('/insights/weeklyActivity');
	insightsService.hooks(hooks);
};
