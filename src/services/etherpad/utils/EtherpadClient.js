const rp = require('request-promise-native');
const { BadRequest } = require('@feathersjs/errors');
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
			this.cookieExpiresSeconds = Configuration.has('ETHERPAD_COOKIE__EXPIRES_SECONDS');
		} else {
			this.cookieExpiresSeconds = 28800;
		}
		if (Configuration.has('ETHERPAD_COOKIE_RELEASE_THRESHOLD')) {
			this.cookieReleaseThreshold = Configuration.has('ETHERPAD_COOKIE_RELEASE_THRESHOLD');
		} else {
			this.cookieReleaseThreshold = 7200;
		}

		this.err = {
			getPad: 'Could not retrieve this Pad.',
			createProject: 'Could not create new Pad',
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

	createOrGetAuthor(params) {
		return rp(this.createSettings({
			method: 'POST',
			endpoint: 'createAuthorIfNotExistsFor',
		}, params))
			.catch((err) => {
				throw new BadRequest(this.err.retrieveBoards, err);
			});
	}

	createOrGetGroup(params) {
		return rp(this.createSettings({
			method: 'POST',
			endpoint: 'createGroupIfNotExistsFor',
		}, params))
			.catch((err) => {
				throw new BadRequest(this.err.retrieveBoards, err);
			});
	}

	getActiveSessions(params) {
		return rp(this.createSettings({
			method: 'POST',
			endpoint: 'listSessionsOfAuthor',
		}, params))
			.catch((err) => {
				throw new BadRequest(this.err.retrieveBoards, err);
			});
	}

	createSession(params) {
		return rp(this.createSettings({
			method: 'POST',
			endpoint: 'createSession',
		}, params))
			.catch((err) => {
				throw new BadRequest(this.err.retrieveBoards, err);
			});
	}

	createGroupPad(params) {
		return rp(this.createSettings({
			endpoint: 'createGroupPad',
		}, params))
			.catch((err) => {
				throw new BadRequest(this.err.retrieveBoards, err);
			});
	}
}

module.exports = new EtherpadClient();
