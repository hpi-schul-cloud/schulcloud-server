const mongoose = require('mongoose');

const { Schema } = mongoose;
// eslint-disable-next-line no-unused-vars
const { info } = require('../src/logger');

const { connect, close } = require('../src/utils/database');

const { schoolSchema } = require('../src/services/school/model');

const School = mongoose.model('school_20200805', schoolSchema, 'schools');

const federalStateSchema = new Schema({
	name: { type: String, required: true },
});

const federalStateModel = mongoose.model('federalState_20200805', federalStateSchema, 'federalstates');

const yearSchema = new Schema({
	name: {
		type: String,
		required: true,
		match: /^[0-9]{4}\/[0-9]{2}$/,
		unique: true,
	},
	startDate: { type: Date, required: true },
	endDate: { type: Date, required: true },
});
const YearModel = mongoose.model('yearModel_20200805', yearSchema, 'years');

const DATE_CLUSTER = new Date('2020-08-05');

const federalStateNames = ['Baden-Württemberg', 'Bayern', 'Internationale Schule'];

module.exports = {
	up: async function up() {
		info('Setting up maintenance mode for schools from Cluster 4 or with no federalState assigned');
		await connect();

		const nextSchoolYearId = await YearModel.findOne({ name: '2020/21' }).select('_id').lean().exec();

		info('Fetch related federal states');
		const federalStates = await federalStateModel
			.find({ name: { $in: federalStateNames } })
			.select('_id name')
			.lean()
			.exec();
		const federalStateIds = federalStates.map((state) => state._id);
		info(`Migrating schools in ${federalStateIds.length}: ${federalStateIds} or with no federal state assigned`);

		const baseQuery = { $or: [{ federalState: { $in: federalStateIds } }, { federalState: { $exists: false } }] };
		const resultLdapSchools = await School.updateMany(
			{ ...baseQuery, ldapSchoolIdentifier: { $exists: true } },
			{ inMaintenanceSince: DATE_CLUSTER }
		).exec();
		info(`Migration result of LDAP Schools: ${resultLdapSchools.nModified} schools updated`);

		const resultNonLdapSchools = await School.updateMany(
			{ ...baseQuery, ldapSchoolIdentifier: { $exists: false } },
			{ currentYear: nextSchoolYearId._id }
		).exec();
		info(`Migration result of Non-LDAP Schools in: ${resultNonLdapSchools.nModified} schools updated`);

		await close();
	},

	down: async function down() {
		await connect();
		info('Disabling Maintenance mode for schools from Cluster 4 or with no federalState assigned');

		const federalStates = await federalStateModel
			.find({ name: { $in: federalStateNames } })
			.select('_id')
			.lean()
			.exec();
		const federalStateIds = federalStates.map((state) => state._id);

		const baseQuery = { $or: [{ federalState: { $in: federalStateIds } }, { federalState: { $exists: false } }] };
		const schools = await School.updateMany(
			{
				...baseQuery,
				ldapSchoolIdentifier: { $exists: true },
				inMaintenanceSince: { $exists: true },
			},
			{ $unset: { inMaintenanceSince: '' } }
		).exec();
		info(`Updated ${schools.nModified} LDAP schools`);

		const currentSchoolYearId = await YearModel.findOne({ name: '2019/20' }).select('_id').lean().exec();
		const nonLdapSchools = await School.updateMany(
			{ ...baseQuery, ldapSchoolIdentifier: { $exists: false } },
			{ currentYear: currentSchoolYearId._id }
		).exec();
		info(`Updated ${nonLdapSchools.nModified} Non-LDAP schools`);

		await close();
	},
};
