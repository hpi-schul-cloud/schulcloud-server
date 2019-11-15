const request = require('request-promise-native');
const hooks = require('../hooks');

function dataMassager(data) {
	const massagedData = data;
	return massagedData;
}

function generateUrl(condition) {
	const query = condition;
	// url for edusharing here
	return query;
}
class SomeService {
	async find(data, params) {
		const options = {
			url: generateUrl(true),
			method: 'GET',
		};
		const eduSharingData = await request(options);
		const result = dataMassager(eduSharingData);
		return result;
	}
}

module.exports = (app) => {
	const eduRoute = '/edusharing/someService';
	app.use(eduRoute, new SomeService());
	const eduService = app.service('/edusharing/someService');
	eduService.hooks(hooks);
};
