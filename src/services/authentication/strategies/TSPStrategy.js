const { AuthenticationBaseStrategy } = require('@feathersjs/authentication');
const { NotAuthenticated } = require('@feathersjs/errors');

const logger = require('../../../logger');
const {
	verifyToken,
	decryptToken,
	createUserAndAccount,
	findSchool,
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

		const now = Date.now() / 1000;
		if (decryptedTicket.iat > now || now > decryptedTicket.exp) {
			throw new NotAuthenticated('TSP token expired.');
		}

		// translate TSP roles into SC roles
		let roles = [];
		if (decryptedTicket.ptscListRolle && typeof decryptedTicket.ptscListRolle === 'string') {
			const roleList = decryptedTicket.ptscListRolle.split(',');
			roles = roleList
				.map((tspRole) => ({
					schueler: 'student',
					lehrer: 'teacher',
					admin: 'administrator',
				}[tspRole.toLowerCase()]))
				.filter((role) => {
					const validRole = role !== undefined;
					if (!validRole) {
						logger.warning(`Got invalid role(s) from TSP API: [${roleList}].`);
					}
					return validRole;
				});
		}

		const { app } = this;
		let user = await this.findUser(app, decryptedTicket);
		if (!user) {
			// User has been created since the last sync, so we'll create him from the ticket info
			const sourceOptions = {
				[SOURCE_ID_ATTRIBUTE]: decryptedTicket.authUID,
			};
			const school = await findSchool(app, decryptedTicket.ptscSchuleNummer);
			const systemId = school.systems[0];
			user = await createUserAndAccount(
				app,
				{
					namePrefix: decryptedTicket.personTitel,
					firstName: decryptedTicket.personVorname,
					lastName: decryptedTicket.personNachname,
					schoolId: school._id,
					source: ENTITY_SOURCE,
					sourceOptions,
				},
				roles,
				systemId,
			);
		} else if (Array.isArray(roles)) {
			// if we know the user and roles were supplied, we need to reflect role changes
			await app.service('users').patch(user._id, { roles });
		}

		const oneDayInMilliseconds = 864e5;
		const timeOfLastSync = Date.now() - oneDayInMilliseconds;

		// trigger an asynchronous TSP sync to reflect changes to classes
		app.service('sync').find({
			query: {
				target: SYNCER_TARGET,
				config: {
					schoolIdentifier: decryptedTicket.ptscSchuleNummer,
					lastChange: timeOfLastSync,
				},
			},
		});

		// find account and generate JWT payload
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
