const request = require('request-promise-native');
const hooks = require('../hooks');

const cubeJsUrl = process.env.INSIGHTS_CUBEJS || 'http://localhost:4000/cubejs-api/';

/**
 * loops through the cubejs-response and returns an object:
 * @param cubeJsDataThis {JSON}
 * @param cubeJsDataLast {JSON}
 * @returns data - object stripped for unnecessary data and prettified
 */
const dataMassager = (cubeJsDataThis, cubeJsDataLast) => {
	const parsedThis = JSON.parse(cubeJsDataThis);
	const parsedLast = JSON.parse(cubeJsDataLast);
	const data = {
		thisWeek: parsedThis.data[0]['Events.activeUsers'] || null,
		lastWeek: parsedLast.data[0]['Events.activeUsers'] || null,
	};

	return data;
};

const generateUrl = (querySort, schoolId) => {
	const query = `v1/load?query={
				"measures":[
				  "Events.activeUsers"
			   ],
			   "timeDimensions" : [
				 {
				   "dimension" : "Events.timeStamp",
					"dateRange" : "${querySort} week"
				 }
			   ],
			   "dimensions" : [],
				"segments" : [],
				"filters" : [
				 {
				   "dimension" : "Actor.school_id" ,
					"operator" : "contains" ,
					"values": ["${schoolId}"]
				 }
			   ]
			  }`;
	return `${cubeJsUrl}${query}`;
};

class WeeklyUsers {
	async find(data, params) {
		const { schoolId } = data.account;

		const thisOptions = {
			url: generateUrl('This', schoolId),
			method: 'GET',
		};
		const lastOptions = {
			url: generateUrl('Last', schoolId),
			method: 'GET',
		};
		const cubeJsDataThis = await request(thisOptions);
		const cubeJsDataLast = await request(lastOptions);

		const result = dataMassager(cubeJsDataThis, cubeJsDataLast);
		return result;
	}
};

module.exports = (app) => {
	const insightRoute = '/insights/weeklyUsers';
	app.use(insightRoute, new WeeklyUsers());
	const insightsService = app.service('/insights/weeklyUsers');
	insightsService.hooks(hooks);
};
