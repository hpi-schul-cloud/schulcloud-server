'use strict';

const request = require('request-promise-native');
const hooks = require('./hooks');
const material = require('./material-model');
const ratingrequestModel = require('./ratingrequest-model');
const mongooseService = require('feathers-mongoose');
const ObjectId = require('mongoose').Types.ObjectId;


const REQUEST_TIMEOUT = 8000; // in ms

class ResourcesService {
	constructor(options) {
		this.options = options || {};
	}

	find(params) {
		const serviceUrls = this.app.get('services') || {};
		const options = {
			uri: serviceUrls.content + '/resources/',
			qs: params.query,
			json: true,
			timeout: REQUEST_TIMEOUT
		};
		return request(options).then(message => {
			return message;
		});
	}

	get(id) {
		const serviceUrls = this.app.get('services') || {};
		const options = {
			uri: serviceUrls.content + '/resources/' + id,
			json: true,
			timeout: REQUEST_TIMEOUT
		};
		return request(options).then(message => {
			return message;
		});
	}

	setup(app, path) {
		this.app = app;
	}
}

class RatingService {
	constructor(options) {
		this.options = options || {};
	}

	create(data, params) {
		const serviceUrls = this.app.get('services') || {};
		return this.options.ratingrequestService.patch(null, { state: "done" }, {
			query: {
				_id: params.query.ratingrequestId,
				state: "pending"
			}
		}).then(patchedData => {
			if(patchedData.length !== 1){
				return
			}
			return request({
				method: 'POST',
				uri: `${serviceUrls.content}/ratings`,
				json: true,
				body: data,
				timeout: REQUEST_TIMEOUT
			})
		})
	}

	setup(app, path) {
		this.app = app;
	}
}

class SearchService {
	constructor(options) {
		this.options = options || {};
	}

	find(params) {
		const serviceUrls = this.app.get('services') || {};
		const options = {
			uri: serviceUrls.content + '/search/',
			qs: params.query,
			json: true,
			timeout: REQUEST_TIMEOUT
		};
		return request(options).then(message => {
			return message;
		});
	}

	setup(app, path) {
		this.app = app;
	}
}

class RatingrequestService {
	constructor(options) {
		this.options = options || {};
	}

	get(userId, params) {
		const serviceUrls = this.app.get('services') || {};
		const courseService = this.app.service('/courses');
		const lessonsService = this.app.service('/lessons'); // topics

		return this.options.ratingrequestService.find({
			query: {
				userId: ObjectId(userId),
				state: "pending"
                // TODO? not older than n days
			}
		}).then(ratingrequests => {
			if(ratingrequests.total === 0){
				return [];
			}
			const courseIds = ratingrequests.data.map(it => it.courseId.toString());
			const topicIds = ratingrequests.data.map(it => it.topicId.toString());
			const materialIds = ratingrequests.data.map(it => it.materialId.toString());

			return Promise.all([
				lessonsService.find({
					query: { _id: { $in: topicIds } }
				}),
				courseService.find({
					query: { _id: { $in: courseIds } }
				}),
				this.options.resourcesService.find({
					query: { _id: { $in: materialIds } }
				})
			]).then(([topics,courses,contents]) =>{
				ratingrequests.data.map((request) =>{
					request.title 		 = contents.data.find( function (content) { return String(content._id) === String(request.materialId);}).title;
					request.courseTitle  = courses.data.find(  function (course)  { return String(course._id)  === String(request.courseId);}).name;
					request.topicTitle 	 = topics.data.find(   function (topic)   { return String(topic._id)   === String(request.topicId);}).name;
					request.providerName = contents.data.find( function (content) { return String(content._id) === String(request.materialId);}).providerName;
				});
				return ratingrequests;
			});


		/*	const materialIds = ratingrequests.data.map(it => it.materialId.toString());

			return this.options.resourcesService.find({
				query: { _id: { $in: materialIds } }
			});*/
		});


	}

	setup(app, path) {
		this.app = app;
	}
}

class RedirectService {
	constructor(options) {
		this.options = options || {};
	}

	get(id, params) {
		const serviceUrls = this.app.get('services') || {};

		const ratingrequest = {
			materialId: id,
			userId: params.query.userId,
			topicId: params.query.topicId,
			courseId: params.query.courseId
		};

		this.options.ratingrequestService.find({
			query: Object.assign({$limit: 0}, ratingrequest)
		}).then(foundObjects => {
			if(foundObjects.total === 0){
				this.options.ratingrequestService.create(ratingrequest);
			}
		});

		return request({
			uri: `${serviceUrls.content}/resources/${id}`,
			json: true,
			timeout: REQUEST_TIMEOUT
		}).then(resource => {
			// Increase Click Counter
			request.patch(serviceUrls.content + '/resources/' + id, {
				json: {
					$inc: {
						clickCount: 1
					}
				}
			});
			return resource.url;
		});
	}

	static redirect(req, res, next) {
		res.redirect(res.data);
	}

	setup(app, path) {
		this.app = app;
	}
}

module.exports = function () {
	const app = this;

	app.use('/content/resources', new ResourcesService());
	const resourcesService = app.service('/content/resources');
	resourcesService.before(hooks.before);
	resourcesService.after(hooks.after);

	app.use('/content/search', new SearchService());
	const searchService = app.service('/content/search');
	searchService.before(hooks.before);
	searchService.after(hooks.after);

	const ratingrequestService = mongooseService({
		Model: ratingrequestModel,
		paginate: {
			default: 10,
			max: 25
		},
		lean: true
	});
	app.use('/content/ratingrequest', new RatingrequestService({ratingrequestService, resourcesService}));

	app.use('/content/redirect', new RedirectService({ratingrequestService}), RedirectService.redirect);

	app.use('/content/ratings', new RatingService({ratingrequestService}));
	const options = {
		Model: material,
		paginate: {
			default: 10,
			max: 25
		},
		lean: true
	};
	app.use('/materials', mongooseService(options));
};
