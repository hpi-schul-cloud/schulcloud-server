const request = require('request-promise-native');
const hooks = require('../hooks');

const cubeJsUrl = process.env.INSIGHTS_CUBEJS || 'http://localhost:4000/cubejs-api/';

/**
 * loops through the cubejs-response and returns an object:
 * @param cubeJsData {JSON}
 * @returns data - object stripped for unnecessary data and prettified
 */
const dataMassager = (cubeJsData) => {
	const parsed = JSON.parse(cubeJsData);
	const data = parsed.data.reduce((a, v) => {
		a[v['Events.timeStamp']] = a[v['Events.timeStamp']] || {
			student: null,
			teacher: null,
		};
		a[v['Events.timeStamp']][v['Actor.roles'].replace(/[^\w\s]/gi, '')] = v['Events.pageCountUnique'];
		return a;
	}, {});
	return data;
};

const generateUrl = (schoolId) => {
	const query = `v1/load?query={
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
};
class UniquePageCount {
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
};

module.exports = (app) => {
	const insightRoute = '/insights/uniquePageCount';
	app.use(insightRoute, new UniquePageCount());
	const insightsService = app.service('/insights/uniquePageCount');
	insightsService.hooks(hooks);
};
