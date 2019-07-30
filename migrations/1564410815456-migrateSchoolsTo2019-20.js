const { connect, close } = require('../src/utils/database');
// We need to import the systems model to register it with mongoose
/* eslint-disable-next-line no-unused-vars */
const System = require('../src/services/system/model');
const { schoolModel: School, yearModel: Year } = require('../src/services/school/model');
const { schoolUsesLdap } = require('../src/services/school/maintenance');
const { info } = require('../src/logger');

module.exports = {
	up: async function up() {
		await connect();

		info('Fetching next school year...');
		const nextYear = await Year.findOne({ name: '2019/20' }).lean().exec();
		info('=>', nextYear);

		info('Fetching schools...');
		const schools = await School.find({})
			.select(['name'])
			.populate(['systems'])
			.lean()
			.exec();
		info(`Got ${schools.length} schools.`);

		for (const school of schools) {
			info(`Migrating ${school.name} (${school._id})...`);
			if (schoolUsesLdap(school)) {
				info('School uses LDAP');
				// schools with active LDAP systems are set into maintenance mode effective immediately
				const result = await School.updateOne({ _id: school._id }, { inMaintenanceSince: Date.now() }).exec();
				info(result);
			} else {
				info('School does not use LDAP');
				// all other schools are migrated to the next year directly
				const result = await School.updateOne({ _id: school._id }, { currentYear: nextYear._id }).exec();
				info(result);
			}
		}

		info('Done.');
		await close();
	},

	down: function down() {
		// not implemented
	},
};
