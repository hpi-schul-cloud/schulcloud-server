const request = require('request-promise-native');
const hooks = require('../hooks');

function dataMassager(cubeJsData) {
	const parsed = JSON.parse(cubeJsData);
	const data = {};
	return parsed;
}
// wip
function generateUrl(schoolId) {
	const cubeJsUrl = process.env.INSIGHTS_CUBEJS || 'http://localhost:4000/cubejs-api/v1/';
	const query = `load?query={
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
}`;
	return `${cubeJsUrl}${query}`;
}
class UniquePageCount {
	async find(data, params) {
		const checkForHexRegExp = /^[a-f\d]{24}$/i;
		if (!data.query || !data.query.schoolId || !checkForHexRegExp.test(data.query.schoolId)) {
			return 'query required: "schoolId" (ObjectId)';
		}
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
	const insightRoute = '/insights/uniquePageCount';
	app.use(insightRoute, new UniquePageCount());
	const insightsService = app.service('/insights/uniquePageCount');
	insightsService.hooks(hooks);
};
