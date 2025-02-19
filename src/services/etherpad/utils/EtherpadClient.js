const axios = require('axios');
const rpErrors = require('request-promise-core/errors');

const { Configuration } = require('@hpi-schul-cloud/commons');
const { BadRequest, Conflict } = require('../../../errors');

const logger = require('../../../logger');

/**
 * Is created and designed as singleton.
 * Options only hold as global envirements, or in config file.
 */
class EtherpadClient {
	constructor() {
		if (Configuration.has('ETHERPAD__URI')) {
			this.uri = () => Configuration.get('ETHERPAD__URI');
			logger.info('Etherpad uri is set to=', this.uri());
		} else {
			this.uri = null;
			logger.info('Etherpad uri is not defined');
		}
		if (Configuration.has('ETHERPAD__COOKIE_EXPIRES_SECONDS')) {
			this.cookieExpiresSeconds = Configuration.get('ETHERPAD__COOKIE_EXPIRES_SECONDS');
		} else {
			this.cookieExpiresSeconds = 28800;
		}
		if (Configuration.has('ETHERPAD__COOKIE_RELEASE_THRESHOLD')) {
			this.cookieReleaseThreshold = Configuration.get('ETHERPAD__COOKIE_RELEASE_THRESHOLD');
		} else {
			this.cookieReleaseThreshold = 7200;
		}

		this.err = {
			createOrGetGroupPad: 'Could not create/get given pad for group.',
			copyOldPadToGroupPad: 'Could not copy given public pad to new group pad.',
			createSession: 'Could not create a session for the given user.',
			createOrGetGroup: 'Could not create/get this group.',
			createOrGetAuthor: 'Could not create/get this author.',
			getActiveSessions: 'Could not get active sessions for this author/group combination.',
		};
	}

	createSettings(
		{
			method = 'POST',
			endpoint,
			formDef = {
				apikey: Configuration.get('ETHERPAD__API_KEY'),
			},
		},
		params = {}
	) {
		const form = { ...formDef, ...params };
		return {
			method,
			url: `${this.uri()}/${endpoint}`,
			data: form,
		};
	}

	handleEtherpadResponse(res) {
		const responseJSON = res.data;
		switch (responseJSON.code) {
			case 0:
				return responseJSON;
			case 1:
				throw new Conflict(responseJSON.message, rpErrors.RequestError(responseJSON.message, res));
			default:
				throw new BadRequest(responseJSON.message, rpErrors.RequestError(responseJSON.message, res));
		}
	}

	createOrGetAuthor(params) {
		return axios(
			this.createSettings(
				{
					endpoint: 'createAuthorIfNotExistsFor',
				},
				params
			)
		)
			.then((res) => this.handleEtherpadResponse(res))
			.catch((err) => {
				throw new BadRequest(this.err.createOrGetAuthor, err);
			});
	}

	createOrGetGroup(params) {
		return axios(
			this.createSettings(
				{
					endpoint: 'createGroupIfNotExistsFor',
				},
				params
			)
		)
			.then((res) => this.handleEtherpadResponse(res))
			.catch((err) => {
				throw new BadRequest(this.err.createOrGetGroup, err);
			});
	}

	getActiveSessions(params) {
		return axios(
			this.createSettings(
				{
					endpoint: 'listSessionsOfAuthor',
				},
				params
			)
		)
			.then((res) => this.handleEtherpadResponse(res))
			.catch((err) => {
				throw new BadRequest(this.err.getActiveSessions, err);
			});
	}

	createSession(params) {
		return axios(
			this.createSettings(
				{
					endpoint: 'createSession',
				},
				params
			)
		)
			.then((res) => this.handleEtherpadResponse(res))
			.catch((err) => {
				throw new BadRequest(this.err.createSession, err);
			});
	}

	createOrGetGroupPad(params) {
		if (params.oldPadId) {
			const newPadId = `${params.groupID}$${params.padName}`;
			const copyParams = {
				sourceID: params.oldPadId,
				destinationID: newPadId,
			};
			return axios(
				this.createSettings(
					{
						endpoint: 'copyPad',
					},
					copyParams
				)
			)
				.then((res) => {
					const response = this.handleEtherpadResponse(res);
					response.data = {
						padID: newPadId,
					};
					return response;
				})
				.catch((err) => {
					throw new BadRequest(this.err.copyOldPadToGroupPad, err);
				});
		}
		return axios(
			this.createSettings(
				{
					endpoint: 'createGroupPad',
				},
				params
			)
		)
			.then((res) => this.handleEtherpadResponse(res))
			.catch((err) => {
				// pad is already there, just return the constructed pad path
				if (err.code === 409) {
					return {
						code: 0,
						message: 'ok',
						data: {
							padID: `${params.groupID}$${params.padName}`,
						},
					};
				}
				throw new BadRequest(this.err.createOrGetGroupPad, err);
			});
	}
}

module.exports = new EtherpadClient();
