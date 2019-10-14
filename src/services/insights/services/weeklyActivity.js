const request = require('request-promise-native');
const hooks = require('../hooks');

function dataMassager(cubeJsData) {
	const parsed = JSON.parse(cubeJsData);
	const data = {
		monday: null,
		tuesday: null,
		wednesday: null,
		thursday: null,
		friday: null,
		saturday: null,
		sunday: null,
	}; // better with "0" instead of null?
	for (const i of parsed.data) {
		data[i['Events.dayOfWeek'].toLowerCase()] = i['Events.count'];
	}
	return data;
}

function generateUri(schoolId = '') {
	const cubeJsUri = 'http://localhost:4000/cubejs-api/v1/load?';
	const query = `query={
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
      "dimension": "Actor.school_id",
      "operator": "contains",
      "values": [${schoolId}]
    }
  ]
}`;


	return `${cubeJsUri}${query}`;
}


class WeeklyActivity {
	async find(data, params) {
		const { schoolId } = data;
		const options = {
			uri: generateUri(schoolId),
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
