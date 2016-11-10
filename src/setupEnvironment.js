/**
 * Created by carl on 03/11/16.
 */

const logger = require('winston');

module.exports = function(app) {
	"use strict";

	const testSchools = [{ name: 'Schiller-Oberschule'}, { name: 'Gymnasium Friedensburg'}];
	const testSystems = [{ type: 'moodle', url: 'http://moodle.schul.tech/'}, { type: 'itslearning'}, { type: 'local'}];

	const systemService = app.service('/systems');
	const schoolService = app.service('/schools');

	return Promise.all(testSystems.map(s => checkTestSystem(s)))
		.then(systems => checkTestSchools(systems))
		.catch(error => logger.error(error));

	function checkTestSystem(definition) {
		return systemService.find({query: definition})
			.then(result => {
				if(result.data.length == 0) {
					return createTestSystem(definition);
				} else {
					return Promise.resolve(result.data[0]);
				}
			})
			.then(result => {
				logger.info(`Found test system with id ${result.id} for ${definition.type}`);
				return result;
			});
	}


	function createTestSystem(definition) {
		logger.info(`Creating test system with parameters ${definition}`);
		return systemService.create(definition)
			.catch(error => {
				logger.error(error);
				throw error;
			});
	}

	function checkTestSchools(systems) {
		return Promise.all([
			checkTestSchool(testSchools[0], [systems[0]]),
			checkTestSchool(testSchools[1], systems)
		]);
	}

	function checkTestSchool(definition, systems) {
		return schoolService.find({query: definition})
			.then(result => {
				const school = result.data[0];
				if(!school) {
					return createTestSchool(definition, systems);
				} else {
					return Promise.resolve(school);
				}
			})
			.then(school => {
				logger.info(`Found test school with id ${school.id} named ${school.name}`);
			});
	}

	function createTestSchool(definition, systems) {
		logger.info('Creating test school');
		let newSchool = definition;
		newSchool.systems = systems;
		return schoolService.create(newSchool);
	}
};

