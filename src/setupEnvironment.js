/**
 * Created by carl on 03/11/16.
 */
const tools = require('./seeds/tools');
const logger = require('winston');

module.exports = function(app) {

	const testSchools = [{ name: 'Schiller-Oberschule'}, { name: 'Gymnasium Friedensburg', _id: '58515cbd593d430be5b89b9e'}];
	const testSystems = [{ type: 'moodle', url: 'http://moodle.schul.tech/'}, { type: 'itslearning'}, { type: 'local'}];
	const testRoles = [
		{ name: 'user', permissions: ['BASE_VIEW', 'DASHBOARD_VIEW', 'TOOL_VIEW'], roles: [] },
		{ name: 'student', permissions: [], roles: ['user'] },
		{ name: 'teacher', permissions: ['LESSONS_VIEW', 'TOOL_NEW_VIEW'], roles: ['user'] },
		{ name: 'administrator', permissions: ['ADMIN_VIEW'], roles: ['user'] },
		{ name: 'superhero', permissions: [], roles: ['user'] }
	];

	const systemService = app.service('/systems');
	const schoolService = app.service('/schools');
	const roleService = app.service('/roles');

	function setup() {
		tools(app);
		return Promise.all(testSystems.map(s => findOrAdd(s, systemService)))
			.then(systems => checkTestSchools(systems))
			.then(() => Promise.all(testRoles.map(r => findOrAdd({name: r.name, permissions: r.permissions}, roleService))))
			.catch(error => logger.error(error));
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


	function findOrAdd(data, service) {
		service.find({query: data})
			.then(result => {
				const match = result.data[0];
				if(!match) {
					logger.info(`Creating seed ${service.Model.modelName}${data.name ? ` named ${data.name}` : ""}${data.type ? ` of type ${data.type}` : ""}`);
					return service.create(data);
				} else {
					return Promise.resolve(match);
				}
			})
			.then(resolved => {
				logger.info(`Found seed ${service.Model.modelName} with id ${resolved._id}${resolved.name ? " named " + resolved.name : ""}${data.type ? ` of type ${data.type}` : ""}`);
			})
			.catch(error => logger.error(error));
	}

	return {
		setup: setup,
		findOrAdd: findOrAdd,
		userRole: testRoles[0]
	};
};

