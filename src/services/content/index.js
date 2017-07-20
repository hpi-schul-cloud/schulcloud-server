'use strict';

const request = require('request-promise-native');
const querystring = require('querystring');
const hooks = require('./hooks');
const _ = require('lodash');
const material = require('./material-model');
const service = require('feathers-mongoose');


class Service {
	constructor(options) {
		this.options = options || {};
	}

	get(id, params) {
		const serviceUrls = this.app.get('services') || {};
		const requestOptions = {
			uri: serviceUrls.content + "/contents/" + id
		};
		return request(requestOptions).then(string => {
			let result = JSON.parse(string);
			if((result.meta || {}).page) {
				result.total = result.meta.page.total;
				result.limit = result.meta.page.limit;
				result.skip = result.meta.page.offset;
			}
			return result;
		});
	}

	find(params) {
		if(params.query.$limit) params.query["page[limit]"] = params.query.$limit;
		if(params.query.$skip) params.query["page[offset]"] = params.query.$skip;
		delete params.query.$limit;	// remove unexpected fields
		delete params.query.$skip;
		if (!params.query.query) delete params.query.query;

		let relevantFilters = _.pickBy(params.query.filter, array => (array.length > 0));	// remove empty arrays
		let filters = _.mapKeys(relevantFilters, (value, key) => `filter[${key}]`);	// undo feathers' square bracket rewriting of the JSON:API filter format
		filters = _.mapValues(filters, (array) => {
			if (array.constructor !== Array) return `["${array}"]`;
			const quoted = array.map(v => `["${v}"]`);	// the content service JSON:API implementation expects comma-separated values in square brackets and string quotation marks
			return quoted.join(',');
		});
		Object.assign(params.query, filters);
		delete params.query.filter;

    const serviceUrls = this.app.get('services') || {};
    params.query.Q = params.query.query;
    delete params.query.query;
		const requestOptions = {
			uri: serviceUrls.content,
			qs: params.query
		};
		return request(requestOptions).then(string => {
			let result = JSON.parse(string);
			if((result.meta || {}).page) {
				result.total = result.meta.page.total;
				result.limit = result.meta.page.limit;
				result.skip = result.meta.page.offset;
			}
			return result;
		});
	}

	setup(app, path) {
		this.app = app;
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

	// Initialize material model
	const options = {
		Model: material,
		paginate: {
			default: 10,
			max: 25
		},
		lean: true
	};

	app.use('/materials', service(options));

	// Get our initialize service to that we can bind hooks
	const contentService = app.service('/contents');
	const materialService = app.service('/materials');

	// Set up our before hooks
	contentService.before(hooks.before);
	materialService.before(hooks.before);

	// Set up our after hooks
	contentService.after(hooks.after);
	contentService.after(hooks.after);
};

module.exports.Service = Service;
