const errors = require('feathers-errors');
const moodleService = require('./moodle');
const app = require('../../app');
const logger = require('winston');
const jwt = require('jsonwebtoken');
const promisify = require('es6-promisify');
const errors = require('feathers-errors');

const MoodleLoginStrategy = require('./strategies/moodle');
const strategies = { moodle: new MoodleLoginStrategy()} ;

module.exports = function(app) {

	const logger = app.logger;
	const systemService = app.service('/systems');
	const accountService = app.service('/accounts');

	class AuthenticationService {

		// POST /auth
		create({username, password, systemId}, params) {

			const accountService = app.service('/accounts');
			const userService = app.service('/users');
			const jwtService = app.service('/auth/token');

			if(!username) return Promise.reject(new errors.BadRequest('no username specified'));
			const credentials = {username: username, password: password};

			return accountService.find({query: {username: username, system: systemId}})
				.then(result => findSingleAccount(result))
				.then(account => {

					if(!account) {
						return createUserAndAccount(credentials, systemId);
					} else {
						return verifyAccount(credentials, systemId);
					}
				})
				.then(verifiedAccount => userService.get(verifiedAccount.userId))
				.then(user => jwtService.create(user));
		}
	}

	/*
	 assert that there is only one account
	 */
	function findSingleAccount(result) {
		const accounts = result.data;
		if(accounts.length > 1) {
			if(!system) {
				throw new errors.BadRequest('Multiple accounts found for this email. Please specify the systemId parameter!');
			} else {
				logger.error(`Found multiple accounts for ${result.query}: ${accounts}`);
				throw new Error();
			}
		} else {
			const account = accounts[0];
			return Promise.resolve(account);
		}
	}

	function verifyLogin(credentials, systemId) {
		systemService.get(systemId)
			.then(system => {
				return strategies[system.type].login(credentials, system);
			})
	}

	function verifyAccount(credentials, systemId) {
		return verifyLogin(credentials, systemId)
			.then( => {
				return accountService.find({query: {email: credentials.username, system: systemId}});
			})
			.then(result => {
				const accounts = result.data;
				if(accounts.length != 1) {
					return Promise.reject(new errors.BadRequest('There is no account associated with this login data'));
				} else {
					return Promise.resolve(accounts[0]);
				}
			}); // TODO: save token
	}

	function createUserAndAccount(username, password, systemId) {
		let client = null;
		return verifyLogin(username, password, systemId)
			.then(_client => {
				client = _client;
				return createUser()
			})
			.then(user => {
				return createAccount(systemId, user.id, username, password, client.token);
			});
	}

	function createAccount(systemId, userId, username, password, token) {
		let data = {
			email: username,
			password: hash(password),
			userId: userId,
			token: token,
			school: null,	// TODO
			system: systemId
		};
		accountService.create(data);
	}

	function createUser() {
		return userService.create({});
	}



	return AuthenticationService;
};
