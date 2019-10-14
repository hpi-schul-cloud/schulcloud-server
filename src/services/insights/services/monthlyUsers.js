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

function generateUri(querySort, schoolId = '') {
	const cubeJsUri = 'http://localhost:4000/cubejs-api/v1/load?';
	const query = `query={
			"measures": [
			"Events.activeUsers"
			],
			"timeDimensions": [
			{
			"dimension": "Events.timeStamp",
			"dateRange": "${querySort} month"
			}
			],
			"filters": [{
				"values": [${schoolId}]
			}]
			}`;
	return `${cubeJsUri}${query}`;
}


class MonthlyUsers {
	async find(data, params) {
		const { schoolId } = data;
		const thisOptions = {
			uri: generateUri('This', schoolId),
			method: 'GET',
		};
		const lastOptions = {
			uri: generateUri('Last', schoolId),
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
