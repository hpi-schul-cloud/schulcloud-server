const request = require('request-promise-native');
const hooks = require('../hooks');

const cubeJsUrl = process.env.INSIGHTS_CUBEJS || 'http://localhost:4000/cubejs-api/';

const dataMassager = (cubeJsData) => {
	const parsed = JSON.parse(cubeJsData);
	const data = {
		Monday: null,
		Tuesday: null,
		Wednesday: null,
		Thursday: null,
		Friday: null,
		Saturday: null,
		Sunday: null,
	};

	parsed.data.forEach((w) => {
		data[w['Events.dayOfWeek'].trim()] = w['Events.count'];
	});
	return data;
}
const generateUrl = (schoolId) => {
	const query = `v1/load?query={
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
};

class WeeklyActivity {
	async find(data, params) {
		const { schoolId } = data.account;

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
