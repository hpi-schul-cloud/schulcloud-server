const logger = require('winston');
const promisify = require('es6-promisify');
const errors = require('feathers-errors');
const request = require('request-promise-native');

const AbstractLoginStrategy = require('./interface.js');

const acceptedCredentials = [
	{username: 'a', password: 'a', roles: ['administrator'], schoolId: '584ad186816abba584714c94'},
	{username: 'lehrer@schul-cloud.org', password: 'schulcloud', roles: ['teacher']},
	{username: 'schueler@schul-cloud.org', password: 'schulcloud', roles: ['student']}
];

class LocalLoginStrategy extends AbstractLoginStrategy {

	login({ username, password}, system) {
		let found = acceptedCredentials.find((credentials) => {
				return credentials.username == username
					&& credentials.password == password;
			});
		if(found) {
			return Promise.resolve(found);
		} else {
			return Promise.reject(new errors.NotAuthenticated('Wrong credentials'));
		}
	}
}

module.exports = LocalLoginStrategy;
