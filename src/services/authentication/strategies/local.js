const logger = require('winston');
const promisify = require('es6-promisify');
const errors = require('feathers-errors');
const request = require('request-promise-native');

const AbstractLoginStrategy = require('./interface.js');

const acceptedCredentials = [
	{username: 'lehrer@schulcloud.org', password: 'schulcloud'},
	{username: 'schueler@schulcloud.org', password: 'schulcloud'}];

class LocalLoginStrategy extends AbstractLoginStrategy {

	login({ username, password}, system) {
		if(acceptedCredentials.find((credentials) => {
				return credentials.username == username
					&& credentials.password == password;
			})) {
			return Promise.resolve({});
		} else {
			return Promise.reject(new errors.NotAuthenticated('Wrong credentials'));
		}
	}
}

module.exports = LocalLoginStrategy;
