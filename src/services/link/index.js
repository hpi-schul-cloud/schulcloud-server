/* eslint-disable max-classes-per-file */

const queryString = require('querystring');
const service = require('feathers-mongoose');
const logger = require('../../logger');
const link = require('./link-model');
const hooks = require('./hooks');
const { HOST, REGISTRATIONLINK_EXPIRATION_DAYS } = require('../../../config/globals');

module.exports = function setup(app) {
	const options = {
		Model: link,
		paginate: {
			default: 10000,
			max: 10000,
		},
		lean: true,
	};

	const registrationLinkExpirationDays = REGISTRATIONLINK_EXPIRATION_DAYS || 30;

	let linkService = service(options);

	const isExpired = (date) => {
		// calculate the date the link will expire on
		date.setDate(date.getDate() + registrationLinkExpirationDays);
		// check if that expiration date has already passed
		return date <= Date.now();
	};

	const isLocalRegistrationLink = (url) => {
		// calculate the beginning of a registrationLink e.g. https://schul-cloud.org/registration/
		const linkPrefix = `${app.settings.services.web}/registration/`;
		// check if url starts with that prefix
		return (url.startsWith(linkPrefix));
	};

	function checkLink(req, res, next) {
		if (req.method === 'GET' && !req.query.target) {
			// capture queries that don't look for the target and check them
			/* eslint-disable-next-line no-underscore-dangle */
			const linkId = req.params.__feathersId;
			return linkService.get(linkId)
				.then((data) => {
					if (isLocalRegistrationLink(data.target) && isExpired(data.createdAt)) {
						// link is both local and has expired
						return res.status(403).json({ error: 'Expired' });
          }
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
					// link is valid
					const [url, query] = data.target.split('?');
					const queryObject = queryString.parse(query || '');
					queryObject.link = data._id;
					return res.json({
						target: `${url}?${queryString.stringify(queryObject)}`,
					});
				})
				.catch((err) => {
					logger.error(err);
					// send not found to client
					return res.status(404).json({ error: 'Not found' });
				});
		}
		delete req.query.includeShortId;
		return next();
	}

	class RegistrationLinkService {
		constructor(opts) {
			this.options = opts || {};
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

			// generate short url
			await app.service('link').create({ target: linkData.link }).then((generatedShortLink) => {
				linkData.shortLink = `${(data.host || HOST)}/link/${generatedShortLink._id}`;
			}).catch((err) => {
				logger.warning(err);
				return Promise.reject(new Error('Fehler beim Erstellen des Kurzlinks.'));
			});

			// remove possible double-slashes in url except the protocol ones
			linkData.shortLink = linkData.shortLink.replace(/(https?:\/\/)|(\/)+/g, '$1$2');

			return linkData;
		}
	}

	class ExpertLinkService {
		constructor(opts) {
			this.options = opts || {};
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
					linkInfo.link = data.host || HOST;
					linkInfo.link += `/registration/${expertSchoolId}/byexpert/?importHash=${linkInfo.hash}`
						.replace(/(https?:\/\/)|(\/)+/g, '$1$2');
				} else if (teamId) { /** @replaced logic is inside team services now * */
					// team accept link for existing users
					linkInfo.link = data.host || HOST;
					linkInfo.link += `/teams/invitation/accept/${teamId}`
						.replace(/(https?:\/\/)|(\/)+/g, '$1$2');
				} else {
					logger.warning('Nicht alle Daten für den Experten-Link vorhanden.');
					return Promise.resolve('Success!');
				}

				// generate short url
				await app.service('link').create({ target: linkInfo.link }).then((generatedShortLink) => {
					linkInfo.shortLinkId = generatedShortLink._id;
					// build final short link and remove possible double-slashes in url except the protocol ones
					linkInfo.shortLink = data.host || HOST;
					linkInfo.shortLink += `/link/${generatedShortLink._id}`.replace(/(https?:\/\/)|(\/)+/g, '$1$2');
				}).catch(() => {
					logger.warning('Fehler beim Erstellen des Kurzlinks.');
					return Promise.resolve('Success!');
				});

				return resolve(linkInfo);
			});
		}
	}


	app.use('/link', checkLink, linkService);
	app.use('/registrationlink', new RegistrationLinkService());
	app.use('/expertinvitelink', new ExpertLinkService());
	linkService = app.service('/link');
	linkService.hooks(hooks);
};
