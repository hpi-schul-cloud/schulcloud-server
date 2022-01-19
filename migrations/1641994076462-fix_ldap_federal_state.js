const mongoose = require('mongoose');
const { ObjectId } = require('mongoose').Types;
const { alert } = require('../src/logger');
const { connect, close } = require('../src/utils/database');
const federalStateModel = require('../src/services/federalState/model');
const systemModel = require('../src/services/system/model');
const { schoolSchema } = require('../src/services/school/model');

const schoolModel = mongoose.model('schools_20211021', schoolSchema, 'schools');

const getFederalStateFromSchool = async (systemId) => {
	// is this ldap configured to more than 1 school?
	const federalStates = await schoolModel
		.aggregate([{ $match: { systems: { $in: [ObjectId(systemId)] } } }, { $group: { _id: '$federalState' } }])
		.exec();

	if (federalStates.length === 0) {
		alert(`LDAP system ${systemId} is not associated to any school`);
		return;
	}
	if (federalStates.length > 1) {
		alert(`LDAP system ${systemId} used in multiple schools from different federal states`);
		return;
	}
	if (federalStates[0]._id === null) {
		alert(`LDAP system ${systemId} cannot be associated with a federal state`);
		return;
	}
	// eslint-disable-next-line consistent-return
	return federalStates[0]._id;
};

const getFederalStates = async (federalStates) =>
	federalStateModel.findOne({ abbreviation: federalStates }).select('_id').lean().exec();

module.exports = {
	up: async function up() {
		await connect();

		const { _id: brandenburg } = await getFederalStates('BB');
		const { _id: lowersaxony } = await getFederalStates('NI');

		const systemsData = await systemModel
			.find({
				type: 'ldap',
			})
			.lean()
			.exec();

		for (const system of systemsData) {
			if (system.ldapConfig && system.ldapConfig.provider) {
				const newLdapConfig = { ...system.ldapConfig };
				switch (system.ldapConfig.provider) {
					case 'univention':
						newLdapConfig.federalState = brandenburg;
						break;
					case 'iserv-idm':
						newLdapConfig.federalState = lowersaxony;
						break;
					case 'iserv':
					case 'general':
					default:
						// eslint-disable-next-line no-await-in-loop
						newLdapConfig.federalState = await getFederalStateFromSchool(system._id);
						break;
				}
				// eslint-disable-next-line no-await-in-loop
				await systemModel.updateOne(
					{
						_id: system._id,
					},
					{
						ldapConfig: newLdapConfig,
					}
				);
			}
		}
		alert('Finished adding federal states to "systems"');
		await close();
	},

	down: async function down() {
		// not implemented
	},
};
