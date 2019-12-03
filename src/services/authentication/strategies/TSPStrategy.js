const { AuthenticationBaseStrategy } = require('@feathersjs/authentication');
const { NotAuthenticated } = require('@feathersjs/errors');

const logger = require('../../../logger');
const {
	decryptToken, verifyToken,
	ENTITY_SOURCE, SOURCE_ID_ATTRIBUTE,
} = require('../../sync/strategies/TSP/TSP');
const { SYNCER_TARGET } = require('../../sync/strategies/TSP/TSPSchoolSyncer');

class TSPStrategy extends AuthenticationBaseStrategy {
	get configuration() {
		const authConfig = this.authentication.configuration;
		const config = super.configuration || {};
		return {
			service: authConfig.service,
			entity: authConfig.entity,
			entityId: authConfig.entityId,
			errorMessage: 'Invalid login',
			entityUsernameField: config.usernameField,
			...config,
		};
	}

	verifyConfiguration() {}

	async findUser(app, token) {
		const sourceOptions = {
			[SOURCE_ID_ATTRIBUTE]: token.authUID,
		};
		const [user] = await app.service('users').find({
			query: {
				source: ENTITY_SOURCE,
				sourceOptions,
				$limit: 1,
			},
			paginate: false,
		});
		return user;
	}

	async authenticate(authentication, params) {
		const { ticket } = authentication;
		let decryptedTicket;
		try {
			const verifiedToken = await verifyToken(ticket);
			decryptedTicket = await decryptToken(verifiedToken);
		} catch (err) {
			logger.error('TSP ticket not valid.', err);
			throw new NotAuthenticated('TSP ticket is not valid.');
		}
		const { app } = this;
		let user = await this.findUser(app, decryptedTicket);
		if (!user) {
			// User might have been created since the last sync
			await app.service('sync').find({}, {
				target: SYNCER_TARGET,
				config: {
					schoolIdentifier: decryptedTicket.ptscSchuleNummer,
				},
			});
			user = await this.findUser(app, decryptedTicket);
			if (!user) {
				// User really does not exist
				throw new NotAuthenticated('User does not exist');
			}
		}
		const [account] = await app.service('accounts').find({
			query: {
				userId: user._id,
				$limit: 1,
			},
			paginate: false,
		});
		const { entity } = this.configuration;
		return {
			authentication: { strategy: this.name },
			[entity]: account,
			payload: {
				accountId: account._id,
				userId: user._id,
				systemId: account.systemId,
			},
		};
	}
}


module.exports = TSPStrategy;
