const { Configuration } = require('@hpi-schul-cloud/commons');
const appPromise = require('../src/app');

const { info, error } = require('../src/logger');

const { yearModel, schoolModel } = require('../src/services/school/model');

const instances = ['default', 'n21'];

const NEXT_SCHOOL_YEAR = '2021/22';

appPromise
	.then(async () => {
		// eslint-disable-next-line no-process-env
		if (!instances.includes(Configuration.get('SC_THEME'))) {
			error(`Wrong Instance.`);
			return process.exit(1);
		}

		const nextSchoolYearId = await yearModel.findOne({ name: NEXT_SCHOOL_YEAR }).select('_id').lean().exec();
		info('Ending up Maintenance mode for LDAP schools');

		const resultLdapSchools = await schoolModel
			.updateMany(
				{
					ldapSchoolIdentifier: { $exists: true },
					inMaintenanceSince: { $exists: true },
				},
				{ $unset: { inMaintenanceSince: '' }, currentYear: nextSchoolYearId._id }
			)
			.exec();

		info(`LDAP Schools ended their Maintenance mode: ${resultLdapSchools.nModified} schools updated`);

		return process.exit(0);
	})
	.catch((err) => {
		error(err);
		return process.exit(1);
	});
