'use strict';

const request = require('request-promise-native');
const querystring = require('querystring');
const hooks = require('./hooks');

class Service {
	constructor(options) {
		this.options = options || {};
	}

	find(params) {
		const options = {};
		if(params.query.$limit) options["page[limit]"] = params.query.$limit;
		if(params.query.$skip) options["page[offset]"] = params.query.$skip;
		if(params.query.query) options.query = params.query.query;

		const contentServerUrl = `https://schul-cloud.org:8090/contents?${querystring.encode(options)}`;
		return request(contentServerUrl).then(string => {
			let result = JSON.parse(string);
			result.total = result.meta.page.total;
			result.limit = result.meta.page.limit;
			result.skip = result.meta.page.offset;
			return result;
		});
	}

	/*get(id, params) {
	 return Promise.resolve({
	 id, text: `A new message with ID: ${id}!`
	 });
	 }*/
}

module.exports = function () {
	const app = this;

	// Initialize our service with any options it requires
	app.use('/contents', new Service());

	// Get our initialize service to that we can bind hooks
	const contentService = app.service('/contents');

	// Set up our before hooks
	contentService.before(hooks.before);

	// Set up our after hooks
	contentService.after(hooks.after);
};

module.exports.Service = Service;
