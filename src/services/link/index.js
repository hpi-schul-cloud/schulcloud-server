'use strict';

const service = require('feathers-mongoose');
const link = require('./link-model');
const hooks = require('./hooks');
const hashService = require('../helpers/hash');

module.exports = function () {
	const app = this;

	const options = {
		Model: link,
		paginate: {
			default: 10000,
			max: 10000
		},
		lean: true
	};

	let linkService = service(options);

	function redirectToTarget(req, res, next) {
		if(req.method == 'GET' && !req.query.target) {	// capture these requests and issue a redirect
			const linkId = req.params.__feathersId;
			linkService.get(linkId)
				.then(data => res.redirect(data.target))
				.catch(error => res.status(500).send(error));
		} else {
			next();
		}
	}
	
	class registrationLinkService {
		constructor(options) {
			this.options = options || {};
			this.docs = {};
		}
		
		async create(data, params) {
			let linkData = {};
			if (data.toHash) {
				await app.service('hash').create(data).then(generatedHash => {
					linkData.hash = generatedHash;
				}).catch(err => {
					return Promise.reject(new Error('Fehler beim Generieren des Hashes.'));
				});
			}
			
			// base link
			if (data.role === 'teacher') linkData.link = `${(data.host || process.env.HOST)}/registration/${data.schoolId}/byemployee`;
			if (data.role === 'student') linkData.link = `${(data.host || process.env.HOST)}/registration/${data.schoolId}`;
			if (linkData.hash) linkData.link += `?id=${linkData.hash}`;
			
			// generate short url
			await app.service('link').create({target: linkData.link}).then(generatedShortLink => {
				linkData.shortLink = `${(data.host || process.env.HOST)}/link/${generatedShortLink._id}`;
			}).catch(err => {
				return Promise.reject(new Error('Fehler beim Erstellen des Kurzlinks.'));
			});
			
			return linkData;
		}
	}

	// Initialize our service with any options it requires
	app.use('/link', redirectToTarget, linkService);
	
	// generate registration link with optional user hash
	app.use('/registrationlink', new registrationLinkService());

	// Get our initialize service to that we can bind hooks
	linkService = app.service('/link');

	// Set up our before hooks
	linkService.before(hooks.before(linkService));

	// Set up our after hooks
	linkService.after(hooks.after);
};
