const logger = require('winston');
const errors = require('@feathersjs/errors');
const request = require('request-promise-native');

const AbstractLoginStrategy = require('./interface.js');

const acceptedCredentials = [
	{ username: 'a', password: 'a' }, // administrator
	{ username: 'lehrer@schul-cloud.org', password: 'schulcloud' }, // teacher
	{ username: 'schueler@schul-cloud.org', password: 'schulcloud' }, // student
];

class LocalLoginStrategy extends AbstractLoginStrategy {
	login({ username, password }, system) {
		const found = acceptedCredentials.find(credentials => credentials.username == username
			&& credentials.password == password);
		if (found) {
			return Promise.resolve(found);
		}
		return Promise.reject(new errors.NotAuthenticated('Wrong credentials'));
	}
}

module.exports = LocalLoginStrategy;
