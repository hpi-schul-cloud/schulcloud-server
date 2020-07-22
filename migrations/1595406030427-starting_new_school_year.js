const mongoose = require('mongoose');
// eslint-disable-next-line no-unused-vars
const { info, error } = require('../src/logger');

const { connect, close } = require('../src/utils/database');

const { schoolSchema } = require('../src/services/school/model');

const School = mongoose.model('school_20200717', schoolSchema, 'schools');
const federalStateModel = require('../src/services/federalState/model');


const DATE_CLUSTER_1 = new Date('2020-07-13');
const DATE_CLUSTER_2 = new Date('2020-07-13');
const DATE_CLUSTER_3 = new Date('2020-07-27');
const DATE_CLUSTER_4 = new Date('2020-08-05');
const DEFAULT_START_DATE = DATE_CLUSTER_1;


const statesWithStartMaintenanceDate = new Map([
	['Berlin', DATE_CLUSTER_1], ['Brandenburg', DATE_CLUSTER_1], ['Hamburg', DATE_CLUSTER_1],
	['Nordrhein-Westfalen', DATE_CLUSTER_1], ['Schleswig-Holstein', DATE_CLUSTER_1],
	['Mecklenburg-Vorpommern', DATE_CLUSTER_1],
	['Hessen', DATE_CLUSTER_2], ['Rheinland-Pfalz', DATE_CLUSTER_2], ['Saarland', DATE_CLUSTER_2],
	['Bremen', DATE_CLUSTER_3], ['Niedersachsen', DATE_CLUSTER_3], ['Sachsen', DATE_CLUSTER_3],
	['Sachsen-Anhalt', DATE_CLUSTER_3], ['Thüringen', DATE_CLUSTER_3],
	['Baden-Württemberg', DATE_CLUSTER_4], ['Bayern', DATE_CLUSTER_4], ['Internationale Schule', DATE_CLUSTER_4],
]);
// use your own name for your model, otherwise other migrations may fail.
// The third parameter is the actually relevent one for what collection to write to.

const getStartMaintenanceDate = (stateId, federalStates) => {
	const stateName = federalStates.get(stateId);
	const startMainentanceDate = statesWithStartMaintenanceDate.get(stateName);
	return startMainentanceDate || DEFAULT_START_DATE;
};

const fetchAllFederalStates = async () => {
	const federalStates = await federalStateModel.find({}).select('_id name').lean().exec();
	return federalStates.reduce((map, state) => {
		map.set(state._id.toString(), state.name);
		return map;
	}, new Map());
};

// How to use more than one schema per collection on mongodb
// https://stackoverflow.com/questions/14453864/use-more-than-one-schema-per-collection-on-mongodb


// TODO npm run migration-persist and remove this line
// TODO update seed data and remove this line

module.exports = {
	up: async function up() {
		info('setting up maintenance mode for schools');
		await connect();

		info('Fetch all federal states');
		const federalStateMap = await fetchAllFederalStates();

		const schools = await School.find({federalState: { $exists: true }}).exec();
		info(`Found ${schools.length} schools.`);
		const result = [];
		for (const school of schools) {
			info(`Migrating ${school.name} (${school._id})...`);
			info(`Federal state name ${school.federalState}`);
			const startMainentanceDate = getStartMaintenanceDate(school.federalState.toString(), federalStateMap);
			school.inMaintenanceSince = startMainentanceDate;
			result.push(school.save());
		}
		await Promise.all(result);

		await close();
	},

	down: async function down() {
		await connect();
		info('Disable Maintenance mode');
		const schools = await School.find({inMaintenanceSince: { $exists: true }}).exec();
		info(`Found ${schools.length} schools.`);
		const result = [];
		for (const school of schools) {
			info(`Migrating ${school.name} (${school._id})...`);
			school.inMaintenanceSince = undefined;
			result.push(school.save());
		}
		await Promise.all(result);

		await close();
	},
};
