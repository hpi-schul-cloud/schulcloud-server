const appPromise = require('../src/app');

const { info, error } = require('../src/logger');

const { yearModel, schoolModel } = require('../src/services/school/model');

const NEXT_SCHOOL_YEAR = '2022/23';

appPromise
	.then(async () => {
		const nextSchoolYearId = await yearModel.findOne({ name: NEXT_SCHOOL_YEAR }).select('_id').lean().exec();
		info('Ending up Maintenance mode for LDAP schools');

		const resultLdapSchools = await schoolModel
			.updateMany(
				{
					ldapSchoolIdentifier: { $exists: true },
					inMaintenanceSince: { $exists: true },
					$or: [{ inUserMigration: { $exists: false } }, { inUserMigration: false }],
				},
				{ $unset: { inMaintenanceSince: '' }, currentYear: nextSchoolYearId._id }
			)
			.exec();

		info(`LDAP Schools ended their Maintenance mode: ${resultLdapSchools.modifiedCount} schools updated`);

		const resultMigratingSchools = await schoolModel
			.updateMany(
				{
					ldapSchoolIdentifier: { $exists: true },
					inMaintenanceSince: { $exists: true },
					inUserMigration: true,
				},
				{ currentYear: nextSchoolYearId._id }
			)
			.exec();

		info(`Migrating Schools changed year: ${resultMigratingSchools.modifiedCount} schools updated`);

		return process.exit(0);
	})
	.catch((err) => {
		error(err);
		return process.exit(1);
	});
