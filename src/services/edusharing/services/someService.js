const request = require('request-promise-native');
const hooks = require('../hooks');

function generateUrl() {
	const url = 'https://mv-repo.schul-cloud.org/edu-sharing/rest/search/v1/custom/-home-?maxItems=10&skipCount=0';
	return url;
}
class SomeService {
	async find(data, params) {
		const options = {
			url: generateUrl(),
			method: 'GET',
			headers: data.headers,
		};
		const eduData = await request(options);
		return eduData;
	}
}

module.exports = (app) => {
	const eduRoute = '/edusharing/someService';
	app.use(eduRoute, new SomeService());
	const eduService = app.service('/edusharing/someService');
	eduService.hooks(hooks);
};
