const errors = require('feathers-errors');
const promisify = require('es6-promisify');
const crypto = require('bcryptjs');
const logger = require('winston');

module.exports = function(app) {

	const MoodleLoginStrategy = require('./strategies/moodle');
	const ITSLearningLoginStrategy = require('./strategies/itslearning');
	const LernsaxLoginStrategy = require('./strategies/lernsax');
	const LocalLoginStrategy = require('./strategies/local');

	const strategies = {
		moodle: new MoodleLoginStrategy(app),
		itslearning: new ITSLearningLoginStrategy(),
		lernsax: new LernsaxLoginStrategy(),
		local: new LocalLoginStrategy()
	};

	class AuthenticationService {

		// POST /auth
		create({username, password, systemId}, params) {

			const accountService = app.service('/accounts');
			const userService = app.service('/users');
			const jwtService = app.service('/auth/token');

			if(!username) throw new errors.BadRequest('no username specified');
			const credentials = {username: username, password: password};

			return accountService.find({query: {username: username, systemId: systemId}})
				.then(result => findSingleAccount(result, systemId))
				.then(account => {
					if(!account) {
						return createUserAndAccount(credentials, systemId);
					} else {
						return verifyAccount(credentials, systemId);
					}
				})
				.then(verifiedAccount => {
					return userService.get(verifiedAccount.userId);
				})
				.then(user => {
					return jwtService.create(user);
				});
		}
	}

	/*
	 assert that there is only one account
	 */
	function findSingleAccount(result, systemId) {
		const accounts = result.data;
		if(accounts.length > 1) {
			if(!systemId) {
				throw new errors.BadRequest('Multiple accounts found for this username. Please specify the systemId parameter!');
			} else {
				logger.error(`Inconsistency: found multiple accounts for authentication request: ${accounts}`);
				return Promise.reject(new errors.GeneralError());
			}
		} else {
			// try to create an account
			const account = accounts[0];
			if(!account && !systemId) {	// a missing systemId means that no account can be created
				throw new errors.BadRequest('No existing account found in system. Please specify the systemId parameter to create a new account!');
			} else {
				return account;	// may be undefined
			}
		}
	}

	function verifyLogin(credentials, systemId) {
		const systemService = app.service('/systems');
		return systemService.get(systemId)
			.then(system => {
				return strategies[system.type].login(credentials, system);
			});
	}

	function verifyAccount(credentials, systemId) {
		const accountService = app.service('/accounts');
		let client = null;
		return verifyLogin(credentials, systemId)
			.then(_client => {
				client = _client;
				return accountService.find({query: {username: credentials.username, systemId: systemId}});
			})
			.then(result => {
				const accounts = result.data;
				if(accounts.length == 0) {
					return Promise.reject(new errors.BadRequest('There is no account associated with this login data'));
				} else {
					return Promise.resolve(accounts[0]);
				}
			})
			.then(account => {
				if(client.token) {	// save the token
					return accountService.patch(account._id, {token: client.token});
				} else {	// do nothing
					return account;
				}
			});
	}

	function createUserAndAccount(credentials, systemId) {
		let client = null;
		return verifyLogin(credentials, systemId)
			.then(_client => {
				client = _client;
				logger.info(`Creating new account for user ${credentials.username} in system ${systemId}`);
				return createUser(_client.roles);
			})
			.then(user => {
				return createAccount(systemId, user._id, credentials, client.token);
			});
	}

	function createAccount(systemId, userId, {username, password}, token) {
		const accountService = app.service('/accounts');
		let data = {
			username: username,
			password: crypto.hashSync(password),
			userId: userId,
			token: token,
			school: null,	// TODO
			systemId: systemId
		};
		return accountService.create(data);
	}

	function createUser(roles) {
		const userService = app.service('/users');
		return userService.create({roles: roles ? roles : []});
	}



	return AuthenticationService;
};
