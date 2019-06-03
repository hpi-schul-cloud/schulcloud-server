
const errors = require('feathers-errors');
const service = require('feathers-mongoose');
const queryString = require('querystring');
const logger = require('winston');
const link = require('./link-model');
const hooks = require('./hooks');

module.exports = function () {
	const app = this;

	const options = {
		Model: link,
		paginate: {
			default: 10000,
			max: 10000,
		},
		lean: true,
	};

	let linkService = service(options);

	function redirectToTarget(req, res, next) {
		if (req.method === 'GET' && !req.query.target) {	// capture these requests and issue a redirect
			const linkId = req.params.__feathersId;
			linkService.get(linkId)
				.then((data) => {
					if (data.data || req.query.includeShortId) {
						const [url, query] = data.target.split('?');
						const queryObject = queryString.parse(query || '');
						queryObject.shortId = data._id;
						res.redirect(`${url}?${queryString.stringify(queryObject)}`);
					} else {
						res.redirect(data.target);
					}
				})
				.catch((err) => {
					logger.warn(err);
					res.status(500).send(err);
				});
		} else {
			delete req.query.includeShortId;
			next();
		}
	}

	class registrationLinkService {
		constructor(options) {
			this.options = options || {};
			this.docs = {};
		}

		async create(data, params) {
			const linkData = {};
			if (data.toHash) {
				try {
					await app.service('hash').create(data).then((generatedHash) => {
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
			linkData.link = linkData.link.replace(/(https?:\/\/)|(\/)+/g, '$1$2');

			// generate short url
			await app.service('link').create({ target: linkData.link }).then((generatedShortLink) => {
				linkData.shortLink = `${(data.host || process.env.HOST)}/link/${generatedShortLink._id}`;
			}).catch((err) => {
				logger.warn(err);
				return Promise.reject(new Error('Fehler beim Erstellen des Kurzlinks.'));
			});

			// remove possible double-slashes in url except the protocol ones
			linkData.shortLink = linkData.shortLink.replace(/(https?:\/\/)|(\/)+/g, '$1$2');

			return linkData;
		}
	}

	class expertLinkService {
		constructor(options) {
			this.options = options || {};
			this.docs = {};
		}

		/**
		 * Generates short expert invite link
		 * @param data = object {
		 *      role: user role = string "teamexpert"/"teamadministrator"
		 *      host: current webaddress from client = string
		 *      teamId: users teamId = string
		 *      invitee: email of user who gets invited = string
		 *      inviter: user id of user who generates the invite = ObjectId/string
		 *      save: make hash link-friendly? = boolean (might be string)
		 *  }
		 */
		create(data, params) {
			return new Promise(async (resolve, reject) => {
				const linkInfo = {};
				const expertSchoolId = data.esid; const { email } = data; const
					{ teamId } = data;

				const hashService = app.service('hash');
				const linkService = app.service('link');

				if (email) {
					// generate import hash
					await hashService.create({
						toHash: email,
						save: true,
						patchUser: true,
					}).then((generatedHash) => {
						linkInfo.hash = generatedHash;
					}).catch((err) => {
						logger.warn(err);
						return Promise.resolve('Success!');
					});
				}

				// build final link and remove possible double-slashes in url except the protocol ones
				if (expertSchoolId && linkInfo.hash) {
					// expert registration link for new users
					linkInfo.link = `${(data.host || process.env.HOST)}/registration/${expertSchoolId}/byexpert/?importHash=${linkInfo.hash}`.replace(/(https?:\/\/)|(\/)+/g, '$1$2');
				} else if (teamId) {	/** @replaced logic is inside team services now * */
					// team accept link for existing users
					linkInfo.link = `${(data.host || process.env.HOST)}/teams/invitation/accept/${teamId}`.replace(/(https?:\/\/)|(\/)+/g, '$1$2');
				} else {
					logger.warn('Nicht alle Daten für den Experten-Link vorhanden.');
					return Promise.resolve('Success!');
				}

				// generate short url
				await linkService.create({ target: linkInfo.link }).then((generatedShortLink) => {
					linkInfo.shortLinkId = generatedShortLink._id;
					// build final short link and remove possible double-slashes in url except the protocol ones
					linkInfo.shortLink = `${(data.host || process.env.HOST)}/link/${generatedShortLink._id}`.replace(/(https?:\/\/)|(\/)+/g, '$1$2');
				}).catch((err) => {
					logger.warn('Fehler beim Erstellen des Kurzlinks.');
					return Promise.resolve('Success!');
				});

				resolve(linkInfo);
			});
		}
	}

	// Initialize our service with any options it requires
	app.use('/link', redirectToTarget, linkService);

	// generate registration link with optional user hash
	app.use('/registrationlink', new registrationLinkService());

	// generate team invite link with optional user role (leader or expert)
	app.use('/expertinvitelink', new expertLinkService());

	// Get our initialize service to that we can bind hooks
	linkService = app.service('/link');

	// Set up our before hooks
	linkService.before(hooks.before(linkService));

	// Set up our after hooks
	linkService.after(hooks.after);
};
