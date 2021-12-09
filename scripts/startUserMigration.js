const { program } = require('commander');
const appPromise = require('../src/app');
const { error } = require('../src/logger');
const { schoolModel } = require('../src/services/school/model');

program
	.option('-s, --systemId <value>', 'id of the system, which will be added to the schools (required argument)')
	.option(
		'-S, --schoolIds <value...>',
		'ids of the schools that should be migrated. If not given all schools with a official school number will be migrated.',
	);

program.parse();

const options = program.opts();

const startUserMigration = async () => {
	const { systemId } = options;
	const schoolsToMigrate = options.schoolIds;
	let schools;
	if (!schoolsToMigrate) {
		schools = schoolModel.find({ officialSchoolNumber: { $exists: true } });
	} else {
		schools = schoolModel.find({ _id: { $in: schoolsToMigrate } });
	}
	for await (const school of schools) {
		try {
			school.ldapSchoolIdentifier = school.officialSchoolNumber;
			if (!school.systems.includes(systemId)) school.systems.push(systemId);
			school.inUserMigration = true;
			school.inMaintenanceSince = new Date();
			// eslint-disable-next-line no-await-in-loop
			await school.save();
		} catch (err) {
			error(`school ${school._id} cannot be set to user migration mode`, err);
		}
	}
	return process.exit(0);
};

appPromise.then(startUserMigration).catch((err) => {
	error(err);
	return process.exit(1);
});
