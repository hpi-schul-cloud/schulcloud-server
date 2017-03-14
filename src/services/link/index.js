'use strict';

const service = require('feathers-mongoose');
const link = require('./link-model');
const hooks = require('./hooks');

module.exports = function () {
	const app = this;

	const options = {
		Model: link,
		paginate: {
			default: 5,
			max: 25
		},
		lean: true
	};

	let linkService = service(options);

	function redirectToTarget(req, res, next) {
		if(req.method == 'GET') {	// capture these requests and issue a redirect
			const linkId = req.params.__feathersId;
			linkService.get(linkId)
				.then(data => res.redirect(data.target))
				.catch(error => res.status(500).send(error));
		} else {
			next();
		}
	}

	// Initialize our service with any options it requires
	app.use('/link', redirectToTarget, linkService);

	// Get our initialize service to that we can bind hooks
	linkService = app.service('/link');

	// Set up our before hooks
	linkService.before(hooks.before(linkService));

	// Set up our after hooks
	linkService.after(hooks.after);
};
