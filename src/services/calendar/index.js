'use strict';

const request = require('request-promise-native');
const hooks = require('./hooks');

const REQUEST_TIMEOUT = 4000; // in ms

/**
 * converts a jsonApi-event to a plain event
 * @param event {object}
 */
const convertJsonApiToEvent = (event) => {
	event._id = event.attributes.uid;
	event.start = new Date(event.attributes.dtstart).getTime();
	event.end = new Date(event.attributes.dtend).getTime();
	event.summary = event.attributes.summary;
	event.title = event.attributes.summary;
	event.location = event.attributes.location;
	event.description = event.attributes.description;
	event["x-sc-courseId"]  = event.attributes["x-sc-courseId"];
	event["x-sc-courseTimeId"] = event.attributes["x-sc-courseTimeId"];
	return event;
};

/**
 * Converts the Server-Request-Body to JsonApi-Body
 * @param body
 * @returns {object} - valid json-api body for calendar-service
 */
const convertEventToJsonApi = (body) => {
	return {
		data: [
			{
				type: "event",
				attributes: {
					summary: body.summary,
					location: body.location,
					description: body.description,
					dtstart: body.startDate,
					dtend: body.endDate || new Date(new Date(body.startDate).getTime() + body.duration).toISOString(),
					dtstamp: new Date,
					transp: "OPAQUE",
					sequence: 0,
					repeat_freq: body.frequency,
					repeat_wkst: body.weekday,
					repeat_until: body.repeat_until,
					"x-sc-courseId": body.courseId,
					"x-sc-courseTimeId": body.courseTimeId
				},
				relationships: {
					"scope-ids": [
						body.scopeId
					],
					"separate-users": false
				}
			}
		]
	};
};

class Service {
	constructor(options) {
		this.options = options || {};
		this.docs = {
			description: 'A proxy-service to handle the standalone schul-cloud calendar service ',
			create: {
				parameters: [
					{
						description: 'the title or summary of a event',
						name: 'summary',
						type: 'string'
					},
					{
						description: 'the location of a event',
						name: 'location',
						type: 'string'
					},
					{
						description: 'the description of a event',
						name: 'description',
						type: 'string'
					},
					{
						description: 'the startDate of a event',
						name: 'startDate',
						type: 'date'
					},
					{
						description: 'the endDate of a event',
						name: 'endDate',
						type: 'date'
					},
					{
						description: 'the duration of a event',
						name: 'duration',
						type: 'number'
					},
					{
						description: 'the frequency of a event',
						name: 'frequency',
						type: 'string'
					},
					{
						description: 'the weekday of a event',
						name: 'weekday',
						type: 'string'
					},
					{
						description: 'the repeat_until of a event',
						name: 'repeat_until',
						type: 'date'
					},
					{
						description: 'the course reference of a event, e.g. for linking to a course page',
						name: 'courseId',
						type: 'string'
					},
					{
						description: 'the course-time reference of a event, e.g. for linking to a specific course-time',
						name: 'courseTimeId',
						type: 'string'
					},
					{
						description: 'the scope reference of a event',
						name: 'scopeId',
						type: 'string'
					}

				],
				summary: 'Creates a new event for the given scope'
			},
			find: {
				parameters: [
					{
						description: 'a valid user id',
						required: true,
						name: 'userId',
						type: 'string'
					}
				],
				summary: 'Gets all events for a given user'
			}
		};
	}

	create(data, params) {

		const serviceUrls = this.app.get('services') || {};

		const userId = (params.account ||{}).userId || params.payload.userId;
		const options = {
			uri: serviceUrls.calendar + '/events/',
			method: 'POST',
			headers: {
				'Authorization': userId
			},
			body: convertEventToJsonApi(data),
			json: true,
			timeout: REQUEST_TIMEOUT
		};

		return request(options).then(events => {
			events = events.data.map(event => {
				return Object.assign(event, {
					title: event.summary,
					allDay: false, // TODO: find correct value
					start: Date.parse(event.dtstart),
					end: Date.parse(event.dtend),
					url: '' // TODO: add x-sc-field
				});
			});
			return events.map(convertJsonApiToEvent);
		});
	}

	find(params) {

		const serviceUrls = this.app.get('services') || {};

		const userId = (params.account ||{}).userId || params.payload.userId;
		const options = {
			uri: serviceUrls.calendar + '/events?all=true',
			headers: {
				'Authorization': userId
			},
			json: true,
			timeout: REQUEST_TIMEOUT
		};

		return request(options).then(events => {
			events = events.data.map(event => {
				return Object.assign(event, {
					title: event.summary,
					allDay: false, // TODO: find correct value
					start: Date.parse(event.dtstart),
					end: Date.parse(event.dtend),
					url: '' // TODO: add x-sc-field
				});
			});

			return events.map(convertJsonApiToEvent);
		});
	}

	/**remove(id, params) {
		const serviceUrls = this.app.get('services') || {};

		const userId = (params.account ||{}).userId || params.payload.userId;
		const options = {
			uri: serviceUrls.calendar + '/events?all=true',
			headers: {
				'Authorization': userId
			},
			json: true,
			method: 'DELETE',
			timeout: REQUEST_TIMEOUT
		};

		return request(options);
	}**/

	setup(app, path) {
		this.app = app;
	}
}

module.exports = function () {
	const app = this;

	// Initialize our service with any options it requires
	app.use('/calendar', new Service());

	// Get our initialize service to that we can bind hooks
	const contentService = app.service('/calendar');

	// Set up our before hooks
	contentService.before(hooks.before);

	// Set up our after hooks
	contentService.after(hooks.after);
};

module.exports.Service = Service;
