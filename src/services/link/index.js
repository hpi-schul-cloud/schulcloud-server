/* eslint-disable max-classes-per-file */

const queryString = require('querystring');
const service = require('feathers-mongoose');
const logger = require('../../logger');
const link = require('./link-model');
const hooks = require('./hooks');
const { HOST } = require('../../../config/globals');

module.exports = function setup() {
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
		if (req.method === 'GET' && !req.query.target) { // capture these requests and issue a redirect
			const linkId = req.params.__feathersId;
			linkService.get(linkId)
				.then((data) => {
					if (data.data || req.query.includeShortId) {
						const [url, query] = data.target.split('?');
						const queryObject = queryString.parse(query || '');
						queryObject.link = data._id;
						if (req.query && req.query.redirect === 'false' && data.target) {
							return res.send({ target: data.target });
						}
						res.redirect(`${url}?${queryString.stringify(queryObject)}`);
					} else {
						res.redirect(data.target);
					}
				})
				.catch((err) => {
					logger.warning(err);
					res.status(500).send(err);
				});
		} else {
			delete req.query.includeShortId;
			next();
		}
	}

	class RegistrationLinkService {
		constructor(options) {
			this.options = options || {};
			this.docs = {};
		}

		async create(data, params) {
			const linkData = {};
			if (data.toHash) {
				try {
					const user = (await app.service('users').find({ query: { email: data.toHash } }) || {}).data[0];
					if (user && user.importHash) linkData.hash = user.importHash;
					else {
						await app.service('hash').create(data).then((generatedHash) => {
							linkData.hash = generatedHash;
						});
					}
				} catch (err) {
					logger.warning(err);
					return Promise.reject(new Error(`Fehler beim Generieren des Hashes. ${err}`));
				}
			}

			// base link
			if (data.role === 'student') {
				linkData.link = `${(data.host || HOST)}/registration/${data.schoolId}`;
			} else {
				linkData.link = `${(data.host || HOST)}/registration/${data.schoolId}/byemployee`;
			}
			if (linkData.hash) linkData.link += `?importHash=${linkData.hash}`;

			// remove possible double-slashes in url except the protocol ones
			linkData.link = linkData.link.replace(/(https?:\/\/)|(\/)+/g, '$1$2');

			// removed shortLinking for registration links
			// TODO remove shortLink property for now
			linkData.shortLink = linkData.link;

			return linkData;
		}
	}

	class ExpertLinkService {
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
			return new Promise(async (resolve) => {
				const linkInfo = {};
				const expertSchoolId = data.esid; const { email } = data; const
					{ teamId } = data;

				const hashService = app.service('hash');
				const linkService = app.service('link');

				if (email) {
					// generate import hash
					const user = (await app.service('users').find({ query: { email: data.toHash } }) || {}).data[0];
					if (user && user.importHash) linkInfo.hash = user.importHash;
					else {
						await hashService.create({
							toHash: email,
							save: true,
							patchUser: true,
						}).then((generatedHash) => {
							linkInfo.hash = generatedHash;
						}).catch((err) => {
							logger.warning(err);
							return Promise.resolve('Success!');
						});
					}
				}

				// build final link and remove possible double-slashes in url except the protocol ones
				if (expertSchoolId && linkInfo.hash) {
					// expert registration link for new users
					linkInfo.link = `/registration/${expertSchoolId}/byexpert/?importHash=${linkInfo.hash}`;
				} else if (teamId) { /** @replaced logic is inside team services now * */
					// team accept link for existing users
					linkInfo.link = `/teams/invitation/accept/${teamId}`;
				} else {
					logger.warning('Nicht alle Daten für den Experten-Link vorhanden.');
					return Promise.resolve('Success!');
				}

				// generate short url
				// build final short link and remove possible double-slashes in url except the protocol ones
				linkInfo.shortLink = data.host || HOST;
				linkInfo.shortLink += linkInfo.link;

				resolve(linkInfo);
			});
		}
	}


	app.use('/link', redirectToTarget, linkService);
	app.use('/registrationlink', new RegistrationLinkService());
	app.use('/expertinvitelink', new ExpertLinkService());
	linkService = app.service('/link');
	linkService.hooks(hooks);
};
