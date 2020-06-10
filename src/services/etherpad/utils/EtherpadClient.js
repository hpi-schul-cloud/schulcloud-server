const rp = require('request-promise-native');
const rpErrors = require('request-promise-core/errors');
const { BadRequest, Conflict } = require('@feathersjs/errors');
const { Configuration } = require('@schul-cloud/commons');

const logger = require('../../../logger');

/**
 * Is created and designed as singleton.
 * Options only hold as global envirements, or in config file.
 */
class EtherpadClient {
	constructor() {
		if (Configuration.has('ETHERPAD_URI')) {
			this.uri = () => Configuration.get('ETHERPAD_URI');
			logger.info('Etherpad uri is set to=', this.uri());
		} else {
			this.uri = null;
			logger.info('Etherpad uri is not defined');
		}
		if (Configuration.has('ETHERPAD_COOKIE__EXPIRES_SECONDS')) {
			this.cookieExpiresSeconds = Configuration.get('ETHERPAD_COOKIE__EXPIRES_SECONDS');
		} else {
			this.cookieExpiresSeconds = 28800;
		}
		if (Configuration.has('ETHERPAD_COOKIE_RELEASE_THRESHOLD')) {
			this.cookieReleaseThreshold = Configuration.get('ETHERPAD_COOKIE_RELEASE_THRESHOLD');
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
			createSession: 'Could not create a session for this author/group combination.',
		};
	}

	createSettings({
		method = 'POST',
		endpoint,
		formDef = {
			apikey: Configuration.get('ETHERPAD_API_KEY'),
		},
		body,
	}, params = {}) {
		const form = { ...formDef, ...params };
		return {
			method,
			uri: `${this.uri()}/${endpoint}`,
			form,
			body,
			json: false,
		};
	}

	handleEtherpadResponse(res) {
		const responseJSON = JSON.parse(res);
		switch (responseJSON.code) {
			case 0:
				return responseJSON;
			case 1:
				throw new Conflict(responseJSON.message, rpErrors.RequestError(responseJSON.message, res));
			default:
				throw new BadRequest(responseJSON.message, rpErrors.RequestError(responseJSON.message, res));
		}
	}

	handleEtherpadError(err, message) {
		throw new BadRequest(message, err);
	}

	createOrGetAuthor(params) {
		return rp(this.createSettings({
			endpoint: 'createAuthorIfNotExistsFor',
		}, params))
		.then((res) => this.handleEtherpadResponse(res))
		.catch((err) => { this.handleEtherpadError(err, this.err.createOrGetAuthor) } );
	}

	createOrGetGroup(params) {
		return rp(this.createSettings({
			endpoint: 'createGroupIfNotExistsFor',
		}, params))
		.then((res) => this.handleEtherpadResponse(res))
		.catch((err) => { this.handleEtherpadError(err, this.err.createOrGetGroup) } );
	}

	getActiveSessions(params) {
		return rp(this.createSettings({
			endpoint: 'listSessionsOfAuthor',
		}, params))
		.then((res) => this.handleEtherpadResponse(res))
		.catch((err) => { this.handleEtherpadError(err, this.err.getActiveSessions) } );
	}

	createSession(params) {
		return rp(this.createSettings({
			endpoint: 'createSession',
		}, params))
		.then((res) => this.handleEtherpadResponse(res))
		.catch((err) => { this.handleEtherpadError(err, this.err.createSession) } );
	}

	createOrGetGroupPad(params) {
		if(params.oldPadId) {
			let newPadId = `${params.groupID}$${params.padName}`;
			let copyParams = {
				sourceID: params.oldPadId,
				destinationID: newPadId,
			};
			return rp(this.createSettings({
				endpoint: 'copyPad',
			}, copyParams))
			.then((res) => {
				let response = this.handleEtherpadResponse(res);
				response.data = {
					padID: newPadId
				};
				return response;
			})
			.catch((err) => { this.handleEtherpadError(err, this.err.copyOldPadToGroupPad) } );
		}
		return rp(this.createSettings({
			endpoint: 'createGroupPad',
		}, params))
		.then((res) => this.handleEtherpadResponse(res))
		.catch((err) => {
			// pad is already there, just return the constructed pad path
			if(err.code === 409) {
				return {
					code: 0,
					message: 'ok',
					data: {
						padID: `${params.groupID}$${params.padName}`
					}
				}
			}
			this.handleEtherpadError(err, this.err.createOrGetGroupPad);
		});
	}
}

module.exports = new EtherpadClient();
