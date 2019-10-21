const request = require('request-promise-native');
const hooks = require('../hooks');
const { findSchool } = require('../helper');

function dataMassager(cubeJsData) {
	const parsed = JSON.parse(cubeJsData);
	const data = {};
	for (const i in parsed.data) {
		if (Object.prototype.hasOwnProperty.call(parsed.data, i)) {
			data[Object.values(parsed.data[i])[0]] =				Object.values(parsed.data[i])[1] || null;
		}
	}
	return data;
}

function generateUrl(schoolId) {
	const cubeJsUrl =		process.env.INSIGHTS_CUBEJS || 'http://localhost:4000/cubejs-api/v1/';
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
		const { userId } = data.account;
		const schoolId = await findSchool(userId);

		const checkForHexRegExp = /^[a-f\d]{24}$/i;
		if (
			!data.query
			|| !data.query.schoolId
			|| !checkForHexRegExp.test(data.query.schoolId)
		) {
			return 'query required: "schoolId" (ObjectId)';
		}
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
