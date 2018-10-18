'use strict';

const service = require('feathers-mongoose');
const link = require('./link-model');
const hooks = require('./hooks');
const logger = require('winston');

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
		if(req.method === 'GET' && !req.query.target) {	// capture these requests and issue a redirect
			const linkId = req.params.__feathersId;
			linkService.get(linkId)
				.then(data => {
					if (data.data) {
						res.redirect(data.target+"?shortId="+data._id);
					} else {
						res.redirect(data.target);
					}
				})
				.catch(err => {
					logger.warn(err);
					res.status(500).send(err);
				});
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
				try {
					await app.service('hash').create(data).then(generatedHash => {
						linkData.hash = generatedHash;
					});
				} catch (err) {
					logger.warn(err);
					return Promise.reject(new Error(`Fehler beim Generieren des Hashes. ${err}`));
				}
			}
			
			// base link
			if (data.role === 'student') {
				linkData.link = `${(data.host || process.env.HOST)}/registration/${data.schoolId}`;
			} else {
				linkData.link = `${(data.host || process.env.HOST)}/registration/${data.schoolId}/byemployee`;
			}
			if (linkData.hash) linkData.link += `?importHash=${linkData.hash}`;
			
			// remove possible double-slashes in url except the protocol ones
			linkData.link = linkData.link.replace(/(https?:\/\/)|(\/)+/g, "$1$2");
			
			// generate short url
			await app.service('link').create({target: linkData.link}).then(generatedShortLink => {
				linkData.shortLink = `${(data.host || process.env.HOST)}/link/${generatedShortLink._id}`;
			}).catch(err => {
				logger.warn(err);
				return Promise.reject(new Error('Fehler beim Erstellen des Kurzlinks.'));
			});
			
			// remove possible double-slashes in url except the protocol ones
			linkData.shortLink = linkData.shortLink.replace(/(https?:\/\/)|(\/)+/g, "$1$2");
			
			return linkData;
		}
	}
	
	class teamLinkService {
		constructor(options) {
			this.options = options || {};
			this.docs = {};
		}
		
		/*
		 * Generates short team invite link and saves additional data to that link.
		 * @param data = object {
		 *      role: user role = string "teamexpert"/"teamadministrator"
		 *      host: current webaddress from client = string
		 *      teamId: users teamId = string
		 *      invitee: email of user who gets invited = string
		 *      inviter: user id of user who generates the invite = ObjectId/string
		 *      save: make hash link-friendly? = boolean (might be string)
		 *  }
		 */
		async create(data, params) {
			let linkInfo = {};
			if (data.teamId) {
				data.toHash = data.teamId;
				try {
					await app.service('hash').create(data).then(generatedHash => {
						linkInfo.teamHash = generatedHash;
					});
				} catch (err) {
					logger.warn(err);
					return Promise.reject(new Error(`Fehler beim Generieren des Hashes. ${err}`));
				}
			}
			
			// base link
			if (data.role === 'teamexpert') {
				linkInfo.link = `${(data.host || process.env.HOST)}/teams/invite/teamexpert/to/${linkInfo.teamHash}`;
			} else if (data.role === 'teamadministrator') {
				linkInfo.link = `${(data.host || process.env.HOST)}/teams/invite/teamadministrator/to/${linkInfo.teamHash}`;
			} else {
				logger.warn('Nicht valide Rolle wurde angegeben, Link konnte nicht generiert werden.');
				return Promise.reject(new Error('Fehler bei der Rollenangabe.'));
			}
			//if (linkInfo.teamHash) linkInfo.link += `?inviteHash=${linkInfo.hash}`;
			
			// remove possible double-slashes in url except the protocol ones
			linkInfo.link = linkInfo.link.replace(/(https?:\/\/)|(\/)+/g, "$1$2");
			
			// data to enrich link
			let linkData = {
				role: data.role,
				teamId: data.teamId,
				inviter: data.inviter,
				invitee: data.invitee
			};
			
			// generate short url
			await app.service('link').create({target: linkInfo.link, data: linkData}).then(generatedShortLink => {
				linkInfo.shortLinkId = generatedShortLink._id;
				linkInfo.shortLink = `${(data.host || process.env.HOST)}/link/${generatedShortLink._id}`;
			}).catch(err => {
				logger.warn(err);
				return Promise.reject(new Error('Fehler beim Erstellen des Kurzlinks.'));
			});
			
			// remove possible double-slashes in url except the protocol ones
			linkInfo.shortLink = linkInfo.shortLink.replace(/(https?:\/\/)|(\/)+/g, "$1$2");
			
			return linkInfo;
		}
	}
	
	// Initialize our service with any options it requires
	app.use('/link', redirectToTarget, linkService);
	
	// generate registration link with optional user hash
	app.use('/registrationlink', new registrationLinkService());
	
	// generate team invite link with optional user role (leader or expert)
	app.use('/teaminvitelink', new teamLinkService());
	
	// Get our initialize service to that we can bind hooks
	linkService = app.service('/link');
	
	// Set up our before hooks
	linkService.before(hooks.before(linkService));
	
	// Set up our after hooks
	linkService.after(hooks.after);
};
