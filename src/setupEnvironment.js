/**
 * Created by carl on 03/11/16.
 */

const logger = require('winston');

module.exports = function(app) {
	"use strict";

	const moodleUrl = 'http://moodle.schul.tech/';
	const systemService = app.service('/systems');
	return systemService.find({query: {url: moodleUrl}})
		.then((result) => {
			if(result.data.length == 0) {
				return createTestSystem();
			} else {
				return Promise.resolve(result.data[0]);
			}
		})
		.then(result => {
			logger.info(`Found test system with id ${result.id} for for ${moodleUrl}`);
		});

	function createTestSystem() {
		logger.info(`Creating test system for ${moodleUrl}`);
		return systemService.create({ type: 'moodle', url: moodleUrl})
			.catch(error => {
				logger.error(error);
				throw error;
			});
	}
};

