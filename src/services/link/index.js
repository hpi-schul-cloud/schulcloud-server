const queryString = require('querystring');
const service = require('feathers-mongoose');
const logger = require('../../logger');
const link = require('./link-model');
const hooks = require('./hooks');

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

	const registrationLinkExpirationDays = app.get('registrationLinkExpirationDays') || 30;

	let linkService = service(options);

	const hasExpired = (date) => {
		// calculate the date the link will expire on
		const expirationDate = new Date(date);
		expirationDate.setDate(expirationDate.getDate() + registrationLinkExpirationDays);
		// check if that expiration date has already passed
		return expirationDate <= Date.now();
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
			linkService.get(linkId)
				.then((data) => {
					if (isLocalRegistrationLink(data.target) && hasExpired(data.createdAt)) {
						// link is both local and has expired
						res.status(403).json({ error: 'Expired' });
					} else {
						// link is valid
						const [url, query] = data.target.split('?');
						const queryObject = queryString.parse(query || '');
						queryObject.link = data._id;
						res.json({
							target: `${url}?${queryString.stringify(queryObject)}`,
						});
					}
				})
				.catch((err) => {
					logger.error(err);
					// send not found to client
					res.status(404).json({ error: 'Not found' });
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
				linkData.link = `${(data.host || process.env.HOST)}/registration/${data.schoolId}`;
			} else {
				linkData.link = `${(data.host || process.env.HOST)}/registration/${data.schoolId}/byemployee`;
			}
			if (linkData.hash) linkData.link += `?importHash=${linkData.hash}`;

			// remove possible double-slashes in url except the protocol ones
			linkData.link = linkData.link.replace(/(https?:\/\/)|(\/)+/g, '$1$2');

			// check if link already exists
			const currentLinks = await app.service('link').find({ query: { target: linkData.link } });

			if (currentLinks && currentLinks.total > 0) {
				// if so, set createdAt date to now so that link expires a month from now
				const id = currentLinks.data[0]._id;
				await app.service('link').patch(id, { createdAt: new Date() }).then((updatedShortlink) => {
					linkData.shortLink = `${(data.host || process.env.HOST)}/link/${updatedShortlink._id}`;
				}).catch((err) => {
					logger.warning(err);
					return Promise.reject(new Error('Fehler beim Erneuern des Kurzlinks.'));
				});
			} else {
				// if not already existent, generate short url
				await app.service('link').create({ target: linkData.link }).then((generatedShortLink) => {
					linkData.shortLink = `${(data.host || process.env.HOST)}/link/${generatedShortLink._id}`;
				}).catch((err) => {
					logger.warning(err);
					return Promise.reject(new Error('Fehler beim Erstellen des Kurzlinks.'));
				});
			}

			// remove possible double-slashes in url except the protocol ones
			linkData.shortLink = linkData.shortLink.replace(/(https?:\/\/)|(\/)+/g, '$1$2');

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
			return new Promise(async (resolve, reject) => {
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
					linkInfo.link = `${(data.host || process.env.HOST)}/registration/${expertSchoolId}/byexpert/?importHash=${linkInfo.hash}`.replace(/(https?:\/\/)|(\/)+/g, '$1$2');
				} else if (teamId) { /** @replaced logic is inside team services now * */
					// team accept link for existing users
					linkInfo.link = `${(data.host || process.env.HOST)}/teams/invitation/accept/${teamId}`.replace(/(https?:\/\/)|(\/)+/g, '$1$2');
				} else {
					logger.warning('Nicht alle Daten für den Experten-Link vorhanden.');
					return Promise.resolve('Success!');
				}

				// generate short url
				await linkService.create({ target: linkInfo.link }).then((generatedShortLink) => {
					linkInfo.shortLinkId = generatedShortLink._id;
					// build final short link and remove possible double-slashes in url except the protocol ones
					linkInfo.shortLink = `${(data.host || process.env.HOST)}/link/${generatedShortLink._id}`.replace(/(https?:\/\/)|(\/)+/g, '$1$2');
				}).catch((err) => {
					logger.warning('Fehler beim Erstellen des Kurzlinks.');
					return Promise.resolve('Success!');
				});

				resolve(linkInfo);
			});
		}
	}


	app.use('/link', checkLink, linkService);
	app.use('/registrationlink', new RegistrationLinkService());
	app.use('/expertinvitelink', new ExpertLinkService());
	linkService = app.service('/link');
	linkService.hooks(hooks);
};
