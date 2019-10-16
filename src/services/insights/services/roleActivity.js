const request = require('request-promise-native');
const hooks = require('../hooks');

function dataMassager(cubeJsData) {
	const parsed = JSON.parse(cubeJsData);
	const teacherData = parsed.data[0] ? parsed.data[0]['Events.count'] : null;
	const studentData = parsed.data[1] ? parsed.data[1]['Events.count'] : null;

	const data = {
		teacherData,
		studentData,
	};
	return data;
}

function generateUri(schoolId) {
	const cubeJsUri = 'http://localhost:4000/cubejs-api/v1/load?';
	const query = `query={
		"measures" : [
		  "Events.count"
	   ],
	   "timeDimensions" : [
		 {
		   "dimension" : "Events.timeStamp" ,
			"dateRange" : "Last 30 days"
		 }
	   ],
	   "dimensions" : [],
	   "segments" : [],
	   "filters" :[{
		"dimension" : "Actor.school_id",
			"operator" : "contains" ,
			"values": ["${schoolId}"]
		 }
		]
	 }`;
	return `${cubeJsUri}${query}`;
}


class RoleActivity {
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
	const insightRoute = '/insights/roleActivity';
	app.use(insightRoute, new RoleActivity());
	const insightsService = app.service('/insights/roleActivity');
	insightsService.hooks(hooks);
};
