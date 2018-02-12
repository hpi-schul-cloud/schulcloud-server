'use strict';

const service = require('feathers-mongoose');
const lesson = require('./model');
const hooks = require('./hooks');

module.exports = function () {
	const app = this;

	const options = {
		Model: lesson,
		paginate: {
			default: 500,
			max: 500
		},
		lean: true
	};

	// Initialize our service with any options it requires
	app.use('/lessons', service(options));

	// Return all lesson.contets which have component = query.type And User = query.user or null
	app.use('/lessons/contents/:type/',{
		find(params){
			return lesson.aggregate([
				{ $unwind :'$contents'},
				{ $match : {"contents.component" : params.query.type}},
				{ $match : {"contents.user_id" : { $in: [params.query.user, null ]}}},
				{ $project : { _id: "$contents._id", content : "$contents.content"} }
				]).exec();
		}
	});

	// Get our initialize service to that we can bind hooks
	const systemService = app.service('/lessons');

	// Set up our before hooks
	systemService.before(hooks.before);

	// Set up our after hooks
	systemService.after(hooks.after);
};
