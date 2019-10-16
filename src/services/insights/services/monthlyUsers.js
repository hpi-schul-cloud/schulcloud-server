// const { BadRequest } = require('@feathersjs/errors');
const request = require('request-promise-native');
const hooks = require('../hooks');

function dataMassager(cubeJsDataThis, cubeJsDataLast) {
	const parsedThis = JSON.parse(cubeJsDataThis);
	const parsedLast = JSON.parse(cubeJsDataLast);
	const data = {
		thisMonth: null,
		lastMonth: null,
	};
	data.thisMonth = parsedThis.data[0]['Events.activeUsers'];
	data.lastMonth = parsedLast.data[0]['Events.activeUsers'];
	return data;
}

function generateUrl(querySort, schoolId) {
	const cubeJsUrl = process.env.INSIGHTS_CUBEJS || 'http://localhost:4000/cubejs-api/v1/';
	const query = `load?query={
				"measures" : [
				  "Events.activeUsers"
			   ],
			   "timeDimensions" : [
				 {
				   "dimension" : "Events.timeStamp" ,
					"dateRange" : "${querySort} month"
				 }
			   ],
			   "dimensions" : [],
				"segments" : [],
				"filters" : [
				 {
				   "dimension" : "Actor.school_id",
					"operator" : "contains" ,
					"values" : ["${schoolId}"]
				 }
			   ]
			  }`;
	return `${cubeJsUrl}${query}`;
}


class MonthlyUsers {
	async find(data, params) {
		const checkForHexRegExp = /^[a-f\d]{24}$/i;
		if (!data.query || !data.query.schoolId || !checkForHexRegExp.test(data.query.schoolId)) {
			return 'query required: "schoolId" (ObjectId)';
		}
		const { schoolId } = data.query;
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
}


module.exports = (app) => {
	const monthlyUsersRoute = '/insights/monthlyUsers';
	app.use(monthlyUsersRoute, new MonthlyUsers());
	const insightsService = app.service('/insights/monthlyUsers');
	insightsService.hooks(hooks);
};
