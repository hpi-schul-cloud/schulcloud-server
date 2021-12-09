const { program } = require('commander');
const appPromise = require('../src/app');
const { alert, error } = require('../src/logger');
const { schoolModel } = require('../src/services/school/model');
const systemModel = require('../src/services/system/model');

program
	.requiredOption('-s, --systemId <value>', '(Required) ID of the system, which will be added to the schools')
	.option(
		'-o, --officialSchoolNumbers <value...>',
		'Official school numbers of the schools that should be migrated (space seperated values). If not given, all schools having an official school number will be migrated.'
	);

program.parse();

const options = program.opts();

const startUserMigration = async () => {
	alert('user migration script started');
	const { systemId } = options;
	const system = await systemModel.findOne({ _id: systemId, 'ldapConfig.rootPath': { $exists: true } });
	if (!system) {
		throw new Error(`System with the id ${systemId} cannot be found. Provide a valid system id instead.`);
	}
	const schoolsToMigrate = options.officialSchoolNumbers;
	let schools;
	if (!schoolsToMigrate) {
		schools = schoolModel.find({ officialSchoolNumber: { $exists: true } });
		const numberOfFoundSchools = await schools.count();
		alert(`${numberOfFoundSchools} schools found that will be migrated`);
	} else {
		schools = schoolModel.find({ officialSchoolNumber: { $in: schoolsToMigrate } });
		const numberOfFoundSchools = await schools.count();
		if (numberOfFoundSchools !== schoolsToMigrate.length) {
			throw new Error(
				`From the given list of schools to migrate, not all schools could be found in the database. Check the provided schools and execute the script again afterwards.`
			);
		}
		alert(`${numberOfFoundSchools} schools found that will be migrated`);
	}
	for await (const school of schools) {
		try {
			school.ldapSchoolIdentifier = `ou=${school.officialSchoolNumber},${system.ldapConfig.rootPath}`;
			if (!school.systems.includes(systemId)) school.systems.push(systemId);
			school.inUserMigration = true;
			school.inMaintenanceSince = new Date();
			// eslint-disable-next-line no-await-in-loop
			await school.save();
		} catch (err) {
			error(`school ${school._id} cannot be set to user migration mode`, err);
		}
	}
	alert('user migration script finished');
	return process.exit(0);
};

appPromise.then(startUserMigration).catch((err) => {
	error(err);
	return process.exit(1);
});
