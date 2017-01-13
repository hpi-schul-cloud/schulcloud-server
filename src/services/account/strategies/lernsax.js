const logger = require('winston');
const promisify = require('es6-promisify');
const errors = require('feathers-errors');
const request = require('request-promise-native');

const AbstractLoginStrategy = require('./interface.js');
const responseStatusCallbacks = {
	'401': {
		'message': 'Not authorized',
		'callback': () => {
			return Promise.reject('NotAuthenticated: wrong password');
		}
	},
	'403': {
		'message': 'Permission denied',
		'callback': () => {
			return Promise.reject('NotAuthenticated: permission denied');
		}
	},
	'200': {
		'message': 'Login success',
		'callback': (username) => {
			return Promise.resolve({
				success: true,
				username: username
			});
		}
	}
};

class LernsaxLoginStrategy extends AbstractLoginStrategy {

	// TODO: system isn't actually required, wait for a real test user from partnerschule
	login({ username, password}, system) {
		const lernsaxOptions = {
			username: username,
			password: password,
			davUrl: system.url ? `http://${username}:${password}@${system.url}` : `https://${username}:${password}@lernsax.de/webdav.php`
		};

		if (!lernsaxOptions.username) return Promise.reject('no username set');
		if (!lernsaxOptions.password) return Promise.reject('no password set');

		return request({
			url: lernsaxOptions.davUrl,
			method: 'Get'
		}).then(function(response) {
			response = typeof(response) == 'string' ? JSON.parse(response) : response;
			return responseStatusCallbacks[response.statusCode.toString()].callback(username);
		}).catch(function(err) {
			err = typeof(err) == 'string' ? JSON.parse(err) : err;
			if (err.statusCode == 404) { // 404 means that the user has access to his file directory which is empty
				return responseStatusCallbacks['200'].callback(username);
			}
			return responseStatusCallbacks[err.statusCode.toString()].callback(username);
		});

	}
}

module.exports = LernsaxLoginStrategy;
