const logger = require('winston');
const promisify = require('es6-promisify');
const errors = require('feathers-errors');
const request = require('request-promise-native');
const roles = require('../../user/roles');

const AbstractLoginStrategy = require('./interface.js');

const acceptedCredentials = [
	{username: 'lehrer@schul-cloud.org', password: 'schulcloud', roles: [roles.roles['teacher']]},
	{username: 'schueler@schul-cloud.org', password: 'schulcloud', roles: [roles.roles['student']]}
	{username: 'a', password: 'a'},
];

class LocalLoginStrategy extends AbstractLoginStrategy {

	login({ username, password}, system) {
		let found = acceptedCredentials.findIndex((credentials) => {
				return credentials.username == username
					&& credentials.password == password;
			});
		if(found) {
			return Promise.resolve(acceptedCredentials[found]);
		} else {
			return Promise.reject(new errors.NotAuthenticated('Wrong credentials'));
		}
	}
}

module.exports = LocalLoginStrategy;
