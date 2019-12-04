const request = require('request-promise-native');
const hooks = require('../hooks');
const EduSharingConnector = require('../logic/connector');

/* function generateUrl() {
// const url = `https://${process.env.ES_DOMAIN}/edu-sharing/rest/search/v1/custom/-home-?property=myProp&value=myValue&maxItems=10&skipCount=0`;
	return url;
} */
class SomeService {
	find(data, params) {
		const { searchValue } = data.query;
		// todo, add skip and count (and props)
		console.log(searchValue, '<-- searchValue');
		return EduSharingConnector.GET(params, searchValue);
	}
}

module.exports = (app) => {
	const eduRoute = '/edusharing/someService';
	app.use(eduRoute, new SomeService());
	const eduService = app.service('/edusharing/someService');
	eduService.hooks(hooks);
};
