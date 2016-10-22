/**
 * Created by carl on 21/10/2016.
 */
'use strict';

const moodleClient = require('moodle-client');
const crypto = require('bcryptjs');
const logger = require('winston');
const jwt = require('jsonwebtoken');
const promisify = require('es6-promisify');

const account = require('../account/model');

module.exports = function(app) {

	class MoodleLoginService {
		// POST /authentication/moodle
		create(data, params) {
			const moodleOptions = {
				username: data.username,
				password: data.password,
				wwwroot: data.wwwroot,
				token: data.token,
				logger: logger/*,
				 service: 'schul-cloud'*/
			};
			const accountService = app.service('/accounts');

			// system requests token from indicated moodle

			let authenticatedClient;
			return moodleClient.init(moodleOptions)
				// 3. on success, the system finds the corresponding account or creates a new one
				// 4. the account _id is sent to the user as a JSON web token
				.then((client) => {
					authenticatedClient = client;
					return accountService.find({email: client.username, system: client.wwwroot});
				})
				.then((queryResults) => {
					const existingAccount = queryResults[0] || queryResults.data && queryResults.data[0];
					if(existingAccount) return Promise.resolve(existingAccount);
					else return accountService.basicCreate({
						email: data.username,
						password: crypto.hashSync(data.password),
						//userId: null,
						token: authenticatedClient.token,
						//reference: {type: String /*, required: true*/},
						//school: {type: Schema.Types.ObjectId /*, required: true*/},
						system: authenticatedClient.wwwroot	// TODO: implement system model
					});
				})
				.then((account) => {
					// return the account id in a JWT
					return promisify(jwt.sign)({id: account.id}, 'shhhhh', {});	// TODO: use a different secret, not the one from the docs
				});
		}
	}
	return MoodleLoginService;
};
