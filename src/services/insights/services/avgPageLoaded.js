const request = require('request-promise-native');
const hooks = require('../hooks');

function dataMassager(cubeJsData) {
	return cubeJsData;
}

function generateUri(schoolId) {
	const cubeJsUri = 'http://localhost:4000/cubejs-api/v1/load?';
	const query = `query={
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
	return `${cubeJsUri}${query}`;
}
class AvgPageLoaded {
	async find(data, params) {
		if (!data.query || !data.query.schoolId) {
			return 'query required: schoolId';
		}
		const { schoolId } = data.query;
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
	const insightRoute = '/insights/avgPageLoaded';
	app.use(insightRoute, new AvgPageLoaded());
	const insightsService = app.service('/insights/avgPageLoaded');
	insightsService.hooks(hooks);
};
