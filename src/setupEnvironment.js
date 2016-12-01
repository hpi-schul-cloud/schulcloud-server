/**
 * Created by carl on 03/11/16.
 */
const tools = require('./seeds/tools');
const logger = require('winston');

module.exports = function(app) {

	const testSchools = [{ name: 'Schiller-Oberschule'}, { name: 'Gymnasium Friedensburg'}];
	const testSystems = [{ type: 'moodle', url: 'http://moodle.schul.tech/'}, { type: 'itslearning'}, { type: 'local'}];
	const testRoles = [
		{ name: 'user', permissions: ['BACKEND_VIEW', 'DASHBOARD_VIEW'], roles: [] },	// TODO: rename BACKEND_VIEW
		{ name: 'student', permissions: [], roles: ['user'] },
		{ name: 'teacher', permissions: ['LESSONS_VIEW'], roles: ['user'] },
		{ name: 'administrator', permissions: [], roles: ['user'] },
		{ name: 'superhero', permissions: [], roles: ['user'] }
	];

	const systemService = app.service('/systems');
	const schoolService = app.service('/schools');
	const roleService = app.service('/roles');

	function setup() {
		tools(app);
		return Promise.all(testSystems.map(s => checkTestSystem(s)))
			.then(systems => checkTestSchools(systems))
			.then(() => Promise.all(testRoles.map(r => checkTestRole(r))))
			.catch(error => logger.error(error));
	}

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
				logger.info(`Found test school with id ${school._id} named ${school.name}`);
			});
	}

	function createTestSchool(definition, systems) {
		logger.info('Creating test school');
		let newSchool = definition;
		newSchool.systems = systems;
		return schoolService.create(newSchool);
	}

	function checkTestRole(definition) {
		let query = {name: definition.name, permissions: definition.permissions};
		return roleService.find({query})
			.then(result => {
				const role = result.data[0];
				if(!role) {
					return createTestRole(definition);
				} else {
					return Promise.resolve(role);
				}
			})
			.then(role => {
				logger.info(`Found test role with id ${role._id} named ${role.name}`);
			})
			.catch(error => logger.error(error));
	}

	function createTestRole(definition) {
		logger.info(`Creating test role ${definition.name}`);
		return roleService.create(definition);
	}

	function _resolveRoleId(name) {
		return roleService.find({query: {name: name}})
			.then(result => {
				const role = result.data[0];
				if(!role) throw new TypeError(`Role ${name} is not a valid role`);
				return role._id;
			});
	}

	return {
		setup: setup,
		checkTestRole: checkTestRole
	};
};

