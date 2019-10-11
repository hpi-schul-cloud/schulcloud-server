const request = require('request-promise-native');
const hooks = require('../hooks');

function dataMassager(cubeJsData) {
	const parsed = JSON.parse(cubeJsData);

	const data = {

	};
	return data;
}

function generateUri() {
	const cubeJsUri = 'http://localhost:4000/cubejs-api/v1/load?';
	const query = `query={
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
            "values": []
          }
        ]
      }`;
	return `${cubeJsUri}${query}`;
}


class DauOverMau {
	async find(data, params) {
		const options = {
			uri: generateUri(),
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
