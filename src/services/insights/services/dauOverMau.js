const request = require('request-promise-native');
const hooks = require('../hooks');
const { findSchool } = require('../helper');

function dataMassager(cubeJsData) {
	const parsed = JSON.parse(cubeJsData);
	const dauOverMau = parsed.data[0]
		? parsed.data[0]['Events.dauToMau']
		: null;
	const data = {
		dauOverMau,
	};
	return data;
}

function generateUrl(schoolId) {
	const cubeJsUrl =		process.env.INSIGHTS_CUBEJS || 'http://localhost:4000/cubejs-api/v1/';
	const query = `load?query={
        "measures": [
          "Events.dauToMau"
        ],
        "timeDimensions": [
          {
            "dimension": "Events.timeStamp",
            "granularity": "day",
            "dateRange": "Yesterday"
          }
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

class DauOverMau {
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
	const insightRoute = '/insights/dauOverMau';
	app.use(insightRoute, new DauOverMau());
	const insightsService = app.service('/insights/dauOverMau');
	insightsService.hooks(hooks);
};
