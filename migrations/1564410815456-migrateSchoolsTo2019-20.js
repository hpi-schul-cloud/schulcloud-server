const { ObjectId } = require('mongoose').Types;

const { connect, close } = require('../src/utils/database');
const System = require('../src/services/system/model');
const { schoolModel: School } = require('../src/services/school/model');
const { info } = require('../src/logger');

module.exports = {
	up: async function up() {
		await connect();
		const ldapSystems = await System.find({ type: 'ldap' }).select('_id').lean().exec();
		const ldapIds = ldapSystems.map(s => s._id);

		// schools with active LDAP systems are set into maintenance mode effective immediately
		info('Migrating LDAP schools...');
		const ldapResult = await School.updateMany({ systems: { $in: ldapIds } }, { inMaintenanceSince: Date.now() });
		info(ldapResult);

		// all other schools are migrated to the next year directly
		info('Migrating non-LDAP schools');
		const nonLdapResult = await School.updateMany({ systems: { $not: { $in: ldapIds } } }, {
			currentYear: new ObjectId('5d2ee323d14ce9844e33f51e'), // 2019/20
		});
		info(nonLdapResult);

		info('Done.');
		await close();
	},

	down: function down() {
		// not implemented
	},
};
