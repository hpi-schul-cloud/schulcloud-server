const request = require('request-promise-native');
const hooks = require('../hooks');

const cubeJsUrl = process.env.INSIGHTS_CUBEJS || 'http://localhost:4000/cubejs-api/';

const dataMassager = (cubeJsData) => {
	const parsed = JSON.parse(cubeJsData);
	const dauOverMau = parsed.data[0]
		? parsed.data[0]['Events.dauToMau']
		: null;
	const data = {
		dauOverMau,
	};
	return data;
};

const generateUrl = (schoolId) => {
	const query = `v1/load?query={
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
	const insightRoute = '/insights/dauOverMau';
	app.use(insightRoute, new DauOverMau());
	const insightsService = app.service('/insights/dauOverMau');
	insightsService.hooks(hooks);
};
