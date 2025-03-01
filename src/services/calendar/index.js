const axios = require('axios');
const { static: staticContent } = require('@feathersjs/express');
const path = require('path');
const queryString = require('qs');

const { Configuration } = require('@hpi-schul-cloud/commons');
const courseCalendarSetup = require('./courseCalendar');

const hooks = require('./hooks');

const calendarUri = Configuration.get('CALENDAR_URI');

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

	// calendar service ignore case of x-params on event-creation
	event['x-sc-courseId'] = event.attributes['x-sc-courseid'];
	event['x-sc-teamId'] = event.attributes['x-sc-teamid'];
	event['x-sc-courseTimeId'] = event.attributes['x-sc-coursetimeid'];

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
				type: 'event',
				attributes: {
					summary: body.summary,
					location: body.location,
					description: body.description,
					dtstart: body.startDate,
					dtend: body.endDate || new Date(new Date(body.startDate).getTime() + body.duration).toISOString(),
					dtstamp: new Date(),
					transp: 'OPAQUE',
					sequence: 0,
					repeat_freq: body.frequency,
					repeat_wkst: body.weekday,
					repeat_until: body.repeat_until,
					'x-sc-courseId': body.courseId,
					'x-sc-teamId': body.teamId,
					'x-sc-featureVideoConference': body.featureVideoConference === 'on',
					'x-sc-courseTimeId': body.courseTimeId,
				},
				relationships: {
					'scope-ids': [body.scopeId],
					'separate-users': false,
				},
			},
		],
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
						type: 'string',
					},
					{
						description: 'the location of a event',
						name: 'location',
						type: 'string',
					},
					{
						description: 'the description of a event',
						name: 'description',
						type: 'string',
					},
					{
						description: 'the startDate of a event',
						name: 'startDate',
						type: 'date',
					},
					{
						description: 'the endDate of a event',
						name: 'endDate',
						type: 'date',
					},
					{
						description: 'the duration of a event',
						name: 'duration',
						type: 'number',
					},
					{
						description: 'the frequency of a event',
						name: 'frequency',
						type: 'string',
					},
					{
						description: 'the weekday of a event',
						name: 'weekday',
						type: 'string',
					},
					{
						description: 'the repeat_until of a event',
						name: 'repeat_until',
						type: 'date',
					},
					{
						description: 'the course reference of a event, e.g. for linking to a course page',
						name: 'courseId',
						type: 'string',
					},
					{
						description: 'the course-time reference of a event, e.g. for linking to a specific course-time',
						name: 'courseTimeId',
						type: 'string',
					},
					{
						description: 'the scope reference of a event',
						name: 'scopeId',
						type: 'string',
					},
				],
				summary: 'Creates a new event for the given scope',
			},
			find: {
				parameters: [
					{
						description: 'a valid user id',
						required: true,
						name: 'userId',
						type: 'string',
					},
				],
				summary: 'Gets all events for a given user',
			},
			remove: {
				parameters: [
					{
						description: 'a valid event id',
						required: true,
						in: 'path',
						name: 'id',
						type: 'string',
					},
				],
				summary: 'Deletes a event from the calendar-service',
			},
			update: {
				parameters: [
					{
						description: 'a valid event id',
						required: true,
						in: 'path',
						name: 'id',
						type: 'string',
					},
				],
				summary: 'Updates a event from the calendar-service',
			},
		};
	}

	async send(options) {
		return axios(options);
	}

	create(data, params) {
		const userId = (params.query || {}).userId || (params.account || {}).userId || params.payload.userId;
		const options = {
			url: `${calendarUri}/events/`,
			method: 'POST',
			headers: {
				Authorization: userId,
			},
			data: convertEventToJsonApi(data),
			timeout: Configuration.get('REQUEST_OPTION__TIMEOUT_MS'),
		};

		return this.send(options).then((res) => {
			const events = (res.data.data || []).map((event) =>
				Object.assign(event, {
					title: event.summary,
					allDay: false, // TODO: find correct value
					start: Date.parse(event.dtstart),
					end: Date.parse(event.dtend),
					url: '', // TODO: add x-sc-field
				})
			);

			return events.map(convertJsonApiToEvent);
		});
	}

	find(params) {
		const userId = (params.query || {}).userId || (params.account || {}).userId || params.payload.userId;
		const options = {
			url: `${calendarUri}/events?${queryString.stringify(params.query)}`,
			headers: {
				Authorization: userId,
			},
			timeout: Configuration.get('REQUEST_OPTION__TIMEOUT_MS'),
		};

		return this.send(options).then((res) => {
			const events =
				(params.query || {}).userId ||
				(res.data.data || res.data || []).map((event) =>
					Object.assign(event, {
						title: event.summary,
						allDay: false, // TODO: find correct value
						start: Date.parse(event.dtstart),
						end: Date.parse(event.dtend),
					})
				);

			return events.map(convertJsonApiToEvent);
		});
	}

	remove(id, params) {
		const userId = (params.query || {}).userId || (params.account || {}).userId || params.payload.userId;
		const options = {
			url: `${calendarUri}/events/${id}`,
			method: 'DELETE',
			headers: {
				Authorization: userId,
			},
			timeout: Configuration.get('REQUEST_OPTION__TIMEOUT_MS'),
			data: { data: [{ type: 'event' }] },
		};

		return this.send(options).then((res) => {
			// calendar returns nothing if event was successfully deleted
			if (!res.data) return { message: 'Successful deleted event' };
			return res;
		});
	}

	update(id, data, params) {
		const userId = (params.query || {}).userId || (params.account || {}).userId || params.payload.userId;
		const options = {
			url: `${calendarUri}/events/${id}`,
			method: 'PUT',
			headers: {
				Authorization: userId,
			},
			data: convertEventToJsonApi(data),
			timeout: Configuration.get('REQUEST_OPTION__TIMEOUT_MS'),
		};

		return this.send(options).then((res) => {
			const events = res.data.data || res.data || [];
			return events.map(convertJsonApiToEvent);
		});
	}

	setup(app) {
		this.app = app;
	}
}

// TODO: Move this to a real index file without including base service
module.exports = function () {
	const app = this;

	app.use('/calendar/api', staticContent(path.join(__dirname, '/docs/openapi.yaml')));

	app.configure(courseCalendarSetup);
	app.use('/calendar', new Service());
	const contentService = app.service('/calendar');
	contentService.hooks(hooks);
};

module.exports.Service = Service;
