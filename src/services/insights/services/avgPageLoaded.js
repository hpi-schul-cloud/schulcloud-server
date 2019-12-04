const request = require('request-promise-native');
const hooks = require('../hooks');

// loops through the cubejs-response and returns an object:
// {
// Date: String // eg: '2019-10-09T14:00:00.000': '545.7500000000000000',
// ...
// }
function dataMassager(cubeJsData) {
	const parsed = JSON.parse(cubeJsData);
	const data = {};
	for (const i in parsed.data) {
		if (Object.prototype.hasOwnProperty.call(parsed.data, i)) {
			data[Object.values(parsed.data[i])[0]] = Object.values(parsed.data[i])[1] || null;
		}
	}
	return data;
}

function generateUrl(schoolId) {
	const cubeJsUrl = process.env.INSIGHTS_CUBEJS || 'http://localhost:4000/cubejs-api/v1/';
	const query = `load?query={
        "measures": [
          "Events.AvgPageLoaded"
        ],
        "timeDimensions": [
          {
            "dimension": "Events.timeStamp",
            "granularity": "hour",
            "dateRange": "Last 7 days"
          }
        ],
        "filters": [
          {
            "dimension": "Actor.school_id",
            "operator": "contains",
            "values": ["${schoolId}"]
          }
        ],
        "dimensions": [],
        "segments": []
      }`;
	return `${cubeJsUrl}${query}`;
}
class AvgPageLoaded {
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
	const insightRoute = '/insights/avgPageLoaded';
	app.use(insightRoute, new AvgPageLoaded());
	const insightsService = app.service('/insights/avgPageLoaded');
	insightsService.hooks(hooks);
};
