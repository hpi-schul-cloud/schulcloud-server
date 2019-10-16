const request = require('request-promise-native');
const hooks = require('../hooks');

function dataMassager(cubeJsData) {
	const data = {};
	return cubeJsData;
}

function generateUri(schoolId) {
	const cubeJsUri = 'http://localhost:4000/cubejs-api/v1/load?';
	const query = `query={
        "measures": [
          "Events.pageCountUnique"
        ],
        "timeDimensions": [
          {
            "dimension": "Events.timeStamp",
            "granularity": "day",
            "dateRange": "Last 30 days"
          }
        ],
        "filters": [
          {
            "dimension": "Actor.school_id",
            "operator": "contains",
            "values": ["${schoolId}"]
          }
        ],
        "dimensions": [
          "Actor.roles"
        ],
        "segments": [
          "Actor.lehrerSchueler"
        ]
      }
      Optionen`;
	return `${cubeJsUri}${query}`;
}
class UniquePageCount {
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
	const insightRoute = '/insights/uniquePageCount';
	app.use(insightRoute, new UniquePageCount());
	const insightsService = app.service('/insights/uniquePageCount');
	insightsService.hooks(hooks);
};
