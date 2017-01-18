const moodleClient = require('moodle-client');
const logger = require('winston');
const promisify = require('es6-promisify');
const errors = require('feathers-errors');

const AbstractLoginStrategy = require('./interface');

class MoodleLoginStrategy extends AbstractLoginStrategy {
	constructor(app) {
		super();
		this.app = app;
	}

	login({username, password}, system) {

		const moodleOptions = {
			username: username,
			password: password,
			wwwroot: system.url,
			//token: data.token,	// TODO: allow to use tokens, check with the API
			logger: logger/*,
			 service: 'schul-cloud'*/
		};
		if (!moodleOptions.username) return Promise.reject('no username set');
		if (!moodleOptions.password/* && !moodleOptions.token*/) return Promise.reject(new errors.NotAuthenticated('No password set'));	// TODO: 'or token'. Also check error type
		if (!moodleOptions.wwwroot) return Promise.reject('no url for moodle login provided');

		return moodleClient.init(moodleOptions)
			.then(client => {	// verify that the login did succeed
				if (!client.token) return Promise.reject(new Error('failed to obtain token'));
				return Promise.resolve(client);
			});
	}

	updateAccount(accountId, moodleClient) {
		const accountService = this.app.service('/accounts');
		return accountService.patch(accountId, {token: moodleClient.token});
	}
}

module.exports = MoodleLoginStrategy;
