const { AuthenticationBaseStrategy } = require('@feathersjs/authentication');
const reqlib = require('app-root-path').require;

const { NotAuthenticated, BadRequest } = reqlib('src/errors');

const logger = require('../../../logger');
const {
	verifyToken,
	decryptToken,
	createUserAndAccount,
	shortenedRegistrationProcess,
	findSchool,
	ENTITY_SOURCE,
	SOURCE_ID_ATTRIBUTE,
	config: TSP_CONFIG,
} = require('../../sync/strategies/TSP/TSP');
const { SYNCER_TARGET } = require('../../sync/strategies/TSP/TSPSchoolSyncer');

const decryptTicket = async (ticket) => {
	try {
		const verifiedToken = await verifyToken(ticket);
		const decryptedTicket = await decryptToken(verifiedToken);
		return decryptedTicket;
	} catch (err) {
		logger.warning('TSP ticket not valid.', { error: err });
		throw new BadRequest('TSP ticket is not valid.');
	}
};

const validateTicket = (decryptedTicket) => {
	// creation and expiration date
	const now = Date.now() / 1000;
	const tenMinutesBuffer = 60 * 10;
	if (decryptedTicket.iat > now + tenMinutesBuffer || now > decryptedTicket.exp) {
		throw new BadRequest('TSP ticket expired.');
	}

	// required attributes for user creation
	const required = ['personVorname', 'personNachname', 'ptscSchuleNummer', 'ptscListRolle', 'authUID'];
	required.forEach((attr) => {
		if (!decryptedTicket[attr]) {
			throw new BadRequest(`TSP ticket does not contain required attribute "${attr}".`);
		}
	});

	// roles attribute
	if (typeof decryptedTicket.ptscListRolle !== 'string') {
		throw new BadRequest('TSP ticket does not contain valid roles.');
	}
};

const findUser = async (app, token) => {
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
};

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

	parse(req, res) {
		if (req.body && req.body.strategy === 'tsp') {
			return {
				strategy: this.name,
			};
		}
		return null;
	}

	async authenticate(authentication, params) {
		const { ticket } = authentication;
		delete authentication.ticket;
		const decryptedTicket = await decryptTicket(ticket);
		validateTicket(decryptedTicket);

		// translate TSP roles into SC roles
		const roleList = decryptedTicket.ptscListRolle.split(',');
		const roles = roleList
			.map(
				(tspRole) =>
					({
						schueler: 'student',
						lehrer: 'teacher',
						admin: 'administrator',
					}[tspRole.toLowerCase()])
			)
			.filter((role) => {
				const validRole = role !== undefined;
				if (!validRole) {
					logger.warning(`Got invalid role(s) from TSP API: [${roleList}].`);
				}
				return validRole;
			});
		if (roles.length === 0) {
			throw new NotAuthenticated('No Schul-Cloud role included in TSP ticket.');
		}

		const { app } = this;
		const school = await findSchool(app, decryptedTicket.ptscSchuleNummer);
		if (!school) {
			throw new BadRequest('Provided school does not exist.');
		}

		let user = await findUser(app, decryptedTicket);
		if (!user) {
			// User has been created since the last sync, so we'll create him from the ticket info
			const sourceOptions = {
				[SOURCE_ID_ATTRIBUTE]: decryptedTicket.authUID,
			};
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
				systemId
			);

			if (TSP_CONFIG.FEATURE_AUTO_CONSENT) {
				await shortenedRegistrationProcess(app, user);
			}
		} else if (Array.isArray(roles)) {
			// if we know the user and roles were supplied, we need to reflect role & school changes
			await app.service('users').patch(user._id, { roles, schoolId: school._id });
		}

		const tspClasses = (decryptedTicket.ptscListKlasseId || '').split(',').map((s) => s.trim());
		if (tspClasses.length > 0) {
			// check if all classes exist and assign the person
			const classes = await app.service('classes').find({
				query: {
					'sourceOptions.tspUid': { $in: tspClasses },
				},
			});
			if (classes.total === tspClasses.length) {
				// todo: assign and update if necessary
			} else {
				// trigger an asynchronous TSP sync to reflect changes to classes
				const oneDayInMilliseconds = 864e5;
				const timeOfLastSync = Date.now() - oneDayInMilliseconds;

				app.service('sync').find({
					query: {
						target: SYNCER_TARGET,
						config: {
							schoolIdentifier: decryptedTicket.ptscSchuleNummer,
							lastChange: timeOfLastSync,
						},
					},
				});
			}
		}

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
		};
	}
}

module.exports = TSPStrategy;
