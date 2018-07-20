'use strict';

const request = require('request-promise-native');
const hooks = require('./hooks');
const swaggerDocs = require('./docs/');

const REQUEST_TIMEOUT = 4000; // in ms 4000

function toQueryString(paramsObject) {
	return Object
		.keys(paramsObject)
		.map(key => `${encodeURIComponent(key)}=${encodeURIComponent(paramsObject[key])}`)
		.join('&');
}

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
	event["x-sc-courseId"]  = event.attributes["x-sc-courseid"];
	event["x-sc-courseTimeId"] = event.attributes["x-sc-coursetimeid"];
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

const mappingScopeIdToTarget = scope => {
	//to do
}

const getScopeFromTarget = (target,account) =>{
	
}

const convertSubscriptionToJsonApi = (body,account,ressourceUrl) => {
	if(!(typeof body==='object')) 
		return {}
	
	return {
		'links':{
			'self':ressourceUrl
		},
		'data':[
			{
				type: "subscription",		//or "external-feed"
				id:account.userId,
				attributes:body,
				relationships:{
					"scope-ids": [account.userId],
					"separate-users": body['separate-users'] || false
				}
			}
		]
	}
}

const validRoute={
	'subscriptions':'subscriptions',
	'events':'events'
}	
const validMethode={
	'GET':'GET',
	'POST':'POST',
	'DELETE':'DELETE',
	'PUT':'PUT'
}
/**
 * converts a jsonApi-event to a plain event
 * @param opt {object} -> self = this, params, data, id, before, after, service, method
 * 			
 */
const getRequestHandler = (opt) =>{	
	const 	self=opt.self, 
			params=opt.params, 
			data=opt.data, 
			id=opt.id, 
			before=opt.before, 
			after=opt.after,
			service=validRoute[opt.service]||'subscriptions',		
			method=validMethode[(opt.method||'GET').toUpperCase()];			
	const 	query=params.query;

	const uri = (self.app.get('services') || {}).calendar + '/'+service ; 
	const uriParams = id ? '/'+id : (query ? '?'+toQueryString(query) : '')
	const userId = (query || {}).userId || (params.account ||{}).userId || params.payload.userId;

	const options = {
		uri: uri + uriParams,
		method: method,
		headers: {'Authorization': userId},
		json: true,
		timeout: REQUEST_TIMEOUT
	};
	
	if(data){
		if( before )
			options.body=before(data,params.account,uri);
		else 
			options.body=data;
	}	
	
	return request(options).then(data => {	
		if(after)
			data=after(data);
		return data
	});
}

//update and get not implemented
class SubscriptionsService {
	constructor(options) {
		this.options = options || {};
		this.docs = swaggerDocs.subscriptions;
	}
	create(data, params) {
		return getRequestHandler({
			self:this,
			method:'post',
			params:params,
			data:data,
			before:convertSubscriptionToJsonApi
		});
	}
	//to return multiple resources for initial data 
	find(params){
		return getRequestHandler({
			self:this,
			params:params
		});
	} 
	
	remove(id, params) {
		return getRequestHandler({
			self:this,
			method:'delete',
			params:params,
			before:convertSubscriptionToJsonApi,
			id:id
		});
	}
	//use as update  
	patch(id, data, params) {
		return getRequestHandler({
			self:this,
			method:'put',
			params:params,
			data:data,
			before:convertSubscriptionToJsonApi,
			id:id
		});
	}

	setup(app, path) {
		this.app = app;
	}
}

class Service {
	constructor(options) {
		this.options = options || {};
		this.docs = swaggerDocs.calendar;
	}

	create(data, params) {
		const serviceUrls = this.app.get('services') || {};

		const userId = (params.query || {}).userId || (params.account || {}).userId || params.payload.userId;
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
			events = (events.data || []).map(event => {
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
		const userId = (params.query || {}).userId || (params.account ||{}).userId || params.payload.userId;
		const options = {
			uri: serviceUrls.calendar + '/events?' + toQueryString(params.query),
			headers: {
				'Authorization': userId
			},
			json: true,
			timeout: REQUEST_TIMEOUT
		};

		return request(options).then(events => {
			events = (params.query || {}).userId || (events.data || events || []).map(event => {
				
				return Object.assign(event, {
					title: event.summary,
					allDay: false, // TODO: find correct value
					start: Date.parse(event.dtstart),
					end: Date.parse(event.dtend)
				});
			});

			return events.map(convertJsonApiToEvent);
		});
		
	}

	remove(id, params) {

		const serviceUrls = this.app.get('services') || {};

		const userId = (params.query || {}).userId || (params.account ||{}).userId || params.payload.userId;
		const options = {
			uri: serviceUrls.calendar + '/events/' + id,
			headers: {
				'Authorization': userId
			},
			json: true,
			method: 'DELETE',
			timeout: REQUEST_TIMEOUT,
			body: {"data": [{"type": "event"}]}
		};

		return request(options).then(res => {
			// calendar returns nothing if event was successfully deleted
			if (!res) return {message: "Successful deleted event"};
			return res;
		});
	}

	update(id, data, params) {

		const serviceUrls = this.app.get('services') || {};

		const userId = (params.query || {}).userId || (params.account ||{}).userId || params.payload.userId;
		const options = {
			uri: serviceUrls.calendar + '/events/' + id,
			method: 'PUT',
			headers: {
				'Authorization': userId
			},
			body: convertEventToJsonApi(data),
			json: true,
			timeout: REQUEST_TIMEOUT
		};

		return request(options).then(events => {
			events = (events.data || events || []);
			return events.map(convertJsonApiToEvent);
		});
	}

	setup(app, path) {
		this.app = app;
	}
}

module.exports = function () {
	const app = this;

	/* _____ Calendar-Service _____ */
	
	// Initialize our service with any options it requires
	app.use('/calendar', new Service());

	// Get our initialize service to that we can bind hooks
	const contentService = app.service('/calendar');

	// Set up our before hooks
	contentService.before(hooks.before);

	// Set up our after hooks
	contentService.after(hooks.after);
	
	/* _____ Subscriptions-Service _____ */
	app.use('/subscriptions', new SubscriptionsService());
	const contentSubscriptionsService = app.service('/subscriptions');
	contentSubscriptionsService.before(hooks.before);		//should work with subscriptions too
	contentSubscriptionsService.after(hooks.afterSubscriptions);
	
};

module.exports.Service = Service;
