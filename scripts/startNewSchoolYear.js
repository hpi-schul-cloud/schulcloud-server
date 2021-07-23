const appPromise = require('../src/app');

const { info, error } = require('../src/logger');

const { yearModel, schoolModel } = require('../src/services/school/model');
const federalStateModel = require('../src/services/federalState/model');

const exceptFederalStateNames = ['Brandenburg'];

const NEXT_SCHOOL_YEAR = '2021/22';
const MAINTENANCE_START_DATE = new Date('2021-08-01');

appPromise
	.then(async () => {
		const nextSchoolYearId = await yearModel.findOne({ name: NEXT_SCHOOL_YEAR }).select('_id').lean().exec();

		const federalStates = await federalStateModel
			.find({ name: { $nin: exceptFederalStateNames } })
			.select('_id name')
			.lean()
			.exec();
		const federalStateIds = federalStates.map((state) => state._id);
		const federalStateNames = federalStates.map((state) => state.name);
		info(`Migrating schools in ${federalStateIds.length} federalstates (${federalStateNames.toString()})`);

		info('Setting up Maintenance mode for LDAP schools');
		const resultLdapSchools = await schoolModel
			.updateMany(
				{
					federalState: { $in: federalStateIds },
					ldapSchoolIdentifier: { $exists: true },
				},
				{ inMaintenanceSince: MAINTENANCE_START_DATE }
			)
			.exec();
		info(`LDAP Schools set in Maintenance mode: ${resultLdapSchools.nModified} schools updated`);

		const resultNonLdapSchools = await schoolModel
			.updateMany(
				{
					federalState: { $in: federalStateIds },
					ldapSchoolIdentifier: { $exists: false },
				},
				{ currentYear: nextSchoolYearId._id }
			)
			.exec();
		info(`Non-LDAP Schools changed year: ${resultNonLdapSchools.nModified} schools updated`);

		return process.exit(0);
	})
	.catch((err) => {
		error(err);
		return process.exit(1);
	});
