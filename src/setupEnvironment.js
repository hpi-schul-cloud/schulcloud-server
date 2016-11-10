/**
 * Created by carl on 03/11/16.
 */

const logger = require('winston');

module.exports = function(app) {
	"use strict";

	const moodleUrl = 'http://moodle.schul.tech/';
	const testSchool = { name: 'Schiller-Oberschule'};

	const systemService = app.service('/systems');
	const schoolService = app.service('/schools');

	return checkTestSystem()
		.then(system => checkTestSchool(system));


	function checkTestSystem() {
		return systemService.find({query: {url: moodleUrl}})
			.then(result => {
				if(result.data.length == 0) {
					return createTestSystem();
				} else {
					return Promise.resolve(result.data[0]);
				}
			})
			.then(result => {
				logger.info(`Found test system with id ${result.id} for ${moodleUrl}`);
				return result;
			});
	}

	function createTestSystem() {
		logger.info(`Creating test system for ${moodleUrl}`);
		return systemService.create({ type: 'moodle', url: moodleUrl})
			.catch(error => {
				logger.error(error);
				throw error;
			});
	}

	function checkTestSchool(system) {
		return schoolService.find({query: testSchool})
			.then(result => {
				const school = result.data[0];
				if(!school) {
					return createTestSchool(system);
				} else {
					return Promise.resolve(school);
				}
			})
			.then(school => {
				logger.info(`Found test school with id ${school.id} named ${school.name}`);
			});
	}

	function createTestSchool(system) {
		logger.info('Creating test school');
		let newSchool = testSchool;
		newSchool.systems = [system];
		return schoolService.create(newSchool);
	}
};

