const mongoose = require('mongoose');
// eslint-disable-next-line no-unused-vars
const { info, error } = require('../src/logger');

const { connect, close } = require('../src/utils/database');

const { schoolSchema, yearModel } = require('../src/services/school/model');

const School = mongoose.model('school_20200717', schoolSchema, 'schools');
const federalStateModel = require('../src/services/federalState/model');


const DATE_CLUSTER_1 = new Date('2020-07-13');
const DATE_CLUSTER_2 = new Date('2020-07-13');
const DATE_CLUSTER_3 = new Date('2020-07-27');
const DEFAULT_START_DATE = DATE_CLUSTER_1;


const statesWithStartMaintenanceDate = new Map([
	['Berlin', DATE_CLUSTER_1], ['Brandenburg', DATE_CLUSTER_1], ['Hamburg', DATE_CLUSTER_1],
	['Nordrhein-Westfalen', DATE_CLUSTER_1], ['Schleswig-Holstein', DATE_CLUSTER_1],
	['Mecklenburg-Vorpommern', DATE_CLUSTER_1],
	['Hessen', DATE_CLUSTER_2], ['Rheinland-Pfalz', DATE_CLUSTER_2], ['Saarland', DATE_CLUSTER_2],
	['Bremen', DATE_CLUSTER_3], ['Niedersachsen', DATE_CLUSTER_3], ['Sachsen', DATE_CLUSTER_3],
	['Sachsen-Anhalt', DATE_CLUSTER_3], ['Thüringen', DATE_CLUSTER_3],
]);
// use your own name for your model, otherwise other migrations may fail.
// The third parameter is the actually relevent one for what collection to write to.

const getStartMaintenanceDate = (stateName) => {
	const startMainentanceDate = statesWithStartMaintenanceDate.get(stateName);
	return startMainentanceDate || DEFAULT_START_DATE;
};

// How to use more than one schema per collection on mongodb
// https://stackoverflow.com/questions/14453864/use-more-than-one-schema-per-collection-on-mongodb


// TODO npm run migration-persist and remove this line
// TODO update seed data and remove this line

module.exports = {
	up: async function up() {
		info('Setting up maintenance mode for schools');
		await connect();

		const nextSchoolYearId = await yearModel.findOne({ name: '2020/21' }).select('_id').lean().exec();
		info('Fetch related federal states');
		const federalStates = await federalStateModel.find(
			{ name: { $in: [...statesWithStartMaintenanceDate.keys()] } },
		).select('_id name').lean().exec();

		for (const federalState of federalStates) {
			info(`Migrating schools in ${federalState.name} (${federalState._id})...`);
			const startMainentanceDate = getStartMaintenanceDate(federalState.name);
			const resultLdapSchools = await School.updateMany({
				federalState: federalState._id,
				ldapSchoolIdentifier: { $exists: true },
			}, { inMaintenanceSince: startMainentanceDate }).exec();
			// eslint-disable-next-line max-len
			info(`Migration result of LDAP Schools in ${federalState.name}: ${resultLdapSchools.nModified} schools updated`);

			const resultNonLdapSchools = await School.updateMany({
				federalState: federalState._id,
				ldapSchoolIdentifier: { $exists: false },
			}, { currentYear: nextSchoolYearId._id }).exec();
			// eslint-disable-next-line max-len
			info(`Migration result of Non-LDAP Schools in ${federalState.name}: ${resultNonLdapSchools.nModified} schools updated`);
		}

		await close();
	},

	down: async function down() {
		await connect();
		info('Disabling Maintenance mode for related schools');
		const federalStates = await federalStateModel.find(
			{ name: { $in: [...statesWithStartMaintenanceDate.keys()] } },
		).select('_id').lean().exec();
		const federalStateIds = federalStates.map((state) => state._id);
		const schools = await School.updateMany({
			federalState: { $in: federalStateIds },
			ldapSchoolIdentifier: { $exists: true },
			inMaintenanceSince: { $exists: true },
		}, { $unset: { inMaintenanceSince: '' } }).exec();
		info(`Updated ${schools.nModified} LDAP schools`);

		info('Reverting the current school year change for related non-LDAP schools');
		const currentSchoolYearId = await yearModel.findOne({ name: '2019/20' }).select('_id').lean().exec();
		const nonLdapSchools = await School.updateMany({
			federalState: { $in: federalStateIds },
			ldapSchoolIdentifier: { $exists: false },
		},
		{ currentYear: currentSchoolYearId._id }).exec();
		info(`Updated ${nonLdapSchools.nModified} Non-LDAP schools`);

		await close();
	},
};
