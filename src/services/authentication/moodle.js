/**
 * Created by carl on 21/10/2016.
 */
'use strict';

const moodleClient = require('moodle-client');
const crypto = require('bcryptjs');
const logger = require('winston');
const jwt = require('jsonwebtoken');
const promisify = require('es6-promisify');
const errors = require('feathers-errors');

const account = require('../account/model');

module.exports = function(app) {

	class MoodleLoginService {
		// POST /authentication/moodle
		create(data, params) {
			const moodleOptions = {
				username: data.username,
				password: data.password,
				wwwroot: data.wwwroot,
				//token: data.token,	// TODO: allow to use tokens, check with the API
				logger: logger/*,
				 service: 'schul-cloud'*/
			};
			const accountService = app.service('/accounts');
			if(!moodleOptions.username) return Promise.reject('no username set');
			if(!moodleOptions.password && !moodleOptions.token) return Promise.reject(new errors.NotAuthenticated('No password set'));	// TODO: 'or token'
			if(!moodleOptions.wwwroot) return Promise.reject('no wwwroot provided');

			// system requests token from indicated moodle

			let authenticatedClient;
			return moodleClient.init(moodleOptions)
				// 3. on success, the system finds the corresponding account or creates a new one
				// 4. the account _id is sent to the user as a JSON web token
				.then((client) => {
					if(!client.token) throw new Error('failed to obtain token');
					authenticatedClient = client;
					const query = {email: moodleOptions.username, system: moodleOptions.wwwroot};
					return accountService.find({query: query});
				})
				.then((queryResults) => {
					const existingAccount = queryResults[0] || queryResults.data && queryResults.data[0];
					if(existingAccount) {
						existingAccount.token = authenticatedClient.token;
						return accountService.update(existingAccount._id, existingAccount)
							.then(() => Promise.resolve(existingAccount));
					}
					else return accountService.basicCreate({
						email: moodleOptions.username,
						password: crypto.hashSync(moodleOptions.password),
						//userId: null,
						token: authenticatedClient.token,
						//reference: {type: String /*, required: true*/},
						//school: {type: Schema.Types.ObjectId /*, required: true*/},
						system: authenticatedClient.wwwroot	// TODO: implement system model
					});
				})
				.then((account) => {
					//accountService.get(account._id).then(fetched => {console.log('fetched ' + fetched.id + fetched.email);});
					// return the account id in a JWT
					return jwt.sign({id: account._id}, 'shhhhh', {});	// TODO: use a different secret, not the one from the docs
				});
		}
	}
	return MoodleLoginService;
};
