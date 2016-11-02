/**
 * Created by carl on 21/10/2016.
 */
'use strict';

const app = require('../../app');
const moodleClient = require('moodle-client');
const logger = require('winston');
const promisify = require('es6-promisify');
const errors = require('feathers-errors');

const AbstractLoginStrategy = require('interface');

//const userService = app.service('/users');
const accountService = app.service('/accounts');


class MoodleLoginStrategy extends AbstractLoginStrategy {

	/*
	 returns a promise with an authenticated client object, or the sign-in error
	 */
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
		return accountService.patch(accountId, {token: moodleClient.token});
	}
}

exports.default = MoodleLoginStrategy;
