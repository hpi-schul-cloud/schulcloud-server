const { promisify } = require('es6-promisify');
const errors = require('@feathersjs/errors');
const path = require('path');
const childProcess = require('child_process');

const execFile = promisify(childProcess.execFile.bind(childProcess));
const phantomjs = require('phantomjs-prebuilt');
const logger = require('../../../logger');

const binPath = phantomjs.path;

const AbstractLoginStrategy = require('./interface.js');

class ITSLearningLoginStrategy extends AbstractLoginStrategy {
	login({ username, password }, system) {
		const itsLearningOptions = {
			username,
			password,
			wwwroot: system,
			logger,
		};
		if (!itsLearningOptions.username) return Promise.reject('No username set');
		if (!itsLearningOptions.password) return Promise.reject(new errors.NotAuthenticated('No password set'));
		if (!itsLearningOptions.wwwroot) return Promise.reject('No url for ITSLearning login provided');

		const childArgs = [
			path.join(__dirname, '/utils/itslearning_phantom.js'), itsLearningOptions.username, itsLearningOptions.password, itsLearningOptions.wwwroot,
		];

		return execFile(binPath, childArgs)
			.then((queryParams) => {
				const itsLearningResponse = {};
				itsLearningResponse.username = this.getParameterByName('Username', queryParams);
				itsLearningResponse.customerId = this.getParameterByName('CustomerId', queryParams);
				itsLearningResponse.hash = this.getParameterByName('Hash', queryParams);
				itsLearningResponse.timeStamp = this.getParameterByName('TimeStamp', queryParams);
				itsLearningResponse.success = !!itsLearningResponse.username;
				if (!itsLearningResponse.success) {
					return Promise.reject(new errors.NotAuthenticated('Wrong username or password'));
				}
				return itsLearningResponse;
			});
	}

	// Regex for the query string
	getParameterByName(name, url) {
		if (!url) {
			url = window.location.href;
		}
		name = name.replace(/[\[\]]/g, '\\$&');
		const regex = new RegExp(`[?&]${name}(=([^&#]*)|&|#|$)`);
		const results = regex.exec(url);
		if (!results) return null;
		if (!results[2]) return '';
		return decodeURIComponent(results[2].replace(/\+/g, ' '));
	}
}

module.exports = ITSLearningLoginStrategy;
