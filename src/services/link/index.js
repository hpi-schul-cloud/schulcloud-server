/* eslint-disable max-classes-per-file */
const { Configuration } = require('@hpi-schul-cloud/commons');
const queryString = require('qs');
const service = require('feathers-mongoose');
const { static: staticContent } = require('@feathersjs/express');
const path = require('path');
const { BadRequest } = require('@feathersjs/errors');

const logger = require('../../logger');
const { LinkModel } = require('./link-model');
const hooks = require('./hooks');

module.exports = function setup() {
	const app = this;

	const options = {
		Model: LinkModel,
		paginate: {
			default: 10000,
			max: 10000,
		},
		lean: true,
		multi: true,
	};

	let linkService = service(options);

	function redirectToTarget(req, res, next) {
		if (req.method === 'GET' && !req.query.target) {
			// capture these requests and issue a redirect
			const linkId = req.params.__feathersId;
			linkService
				.get(linkId)
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

		/**
		 * Generates short registration link, optionally with user hash.
		 * @param {String} data.role user role = "teacher" / "student"
		 * @param {Boolean} data.save hash will be generated with URI-safe characters
		 * @param {Boolean} data.patchUser hash will be patched into the user (DB)
		 * @param {String} data.host urrent webaddress from client
		 * @param {String} data.schoolId users schoolId
		 * @param {String} data.toHash optional, user account mail for hash generation
		 */
		async create(data, params) {
			const linkData = {};
			if (data.hash) {
				linkData.hash = data.hash;
			} else if (data.toHash) {
				try {
					const user = ((await app.service('users').find({ query: { email: data.toHash } })) || {}).data[0];
					if (user && user.importHash) linkData.hash = user.importHash;
					else {
						if (user) {
							const account = ((await app.service('accounts').find({ query: { userId: user._id } })) || {})[0];
							if (account && account.userId) {
								throw new BadRequest(`User already has an account.`);
							}
						}

						const generatedHash = await app.service('hash').create(data);
						linkData.hash = generatedHash;
					}
				} catch (err) {
					logger.warning(err);
					return Promise.reject(new Error(`Fehler beim Generieren des Hashes. ${err}`));
				}
			}

			// base link
			if (data.role === 'student' || (data.role.name && data.role.name === 'student')) {
				linkData.link = `${data.host || Configuration.get('HOST')}/registration/${data.schoolId}`;
			} else {
				linkData.link = `${data.host || Configuration.get('HOST')}/registration/${data.schoolId}/byemployee`;
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
				const expertSchoolId = data.esid;
				const { email } = data;
				const { teamId } = data;

				if (email) {
					const { data: userData } = await app.service('users').find({ query: { email: data.toHash } });
					if (userData && userData[0] && userData[0].importHash) {
						linkInfo.hash = userData[0].importHash;
					} else {
						linkInfo.hash = await app.service('hash').create({
							toHash: email,
							save: true,
							patchUser: true,
						});
					}
				}

				// build final link and remove possible double-slashes in url except the protocol ones
				if (expertSchoolId && linkInfo.hash) {
					// expert registration link for new users
					linkInfo.link = `/registration/${expertSchoolId}/byexpert/?importHash=${linkInfo.hash}`;
				} else if (teamId) {
					/** @replaced logic is inside team services now * */
					// team accept link for existing users
					linkInfo.link = `/teams/invitation/accept/${teamId}`;
				} else {
					logger.warning('Nicht alle Daten für den Experten-Link vorhanden.');
					return Promise.resolve('Success!');
				}

				// generate short url
				// build final short link and remove possible double-slashes in url except the protocol ones
				linkInfo.shortLink = data.host || Configuration.get('HOST');
				linkInfo.shortLink += linkInfo.link;

				resolve(linkInfo);
			});
		}
	}

	app.use('/link/api', staticContent(path.join(__dirname, '/docs/openapi.yaml')));

	app.use('/link', redirectToTarget, linkService);
	app.use('/registrationlink', new RegistrationLinkService());
	app.use('/expertinvitelink', new ExpertLinkService());

	linkService = app.service('/link');
	linkService.hooks(hooks);
};
