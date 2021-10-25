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
	const schoolsBySystem = await schoolModel
		.aggregate([{ $match: { systems: { $in: [ObjectId(systemId)] } } }, { $group: { _id: '$federalState' } }])
		.exec();

	if (schoolsBySystem.length === 0) {
		alert(`LDAP system ${systemId} is not associated to any school`);
		return null;
	}
	if (schoolsBySystem.length > 1) {
		alert(`LDAP system ${systemId} used in multiple schools from different federal states`);
		return null;
	}
	return schoolsBySystem[0]._id;
};

const getFederalState = async (federalStates) =>
	federalStateModel
		.find({ abbreviation: { $in: federalStates } })
		.select('_id')
		.lean()
		.exec();

module.exports = {
	up: async function up() {
		await connect();

		const [{ _id: brandenburg }, { _id: lowersaxony }, { _id: thuringia }] = await getFederalState(['BB', 'NI', 'TH']);

		const systemsData = await systemModel
			.find({
				type: { $in: ['ldap', 'iserv', 'tsp-base', 'tsp-school'] },
				'ldapConfig.federalState': { $eq: null },
			})
			.lean()
			.exec();

		for (const system of systemsData) {
			const newLdapConfig = { ...system.ldapConfig };

			if (system.type === 'tsp' || system.type === 'tsp-school') {
				newLdapConfig.federalState = thuringia;
			} else if (system.ldapConfig && system.ldapConfig.provider) {
				switch (system.ldapConfig.provider) {
					case 'univention':
						newLdapConfig.federalState = brandenburg;
						break;
					case 'iserv':
					case 'iserv-idm':
						newLdapConfig.federalState = lowersaxony;
						break;
					case 'general':
					default:
						// eslint-disable-next-line no-await-in-loop
						newLdapConfig.federalState = await getFederalStateFromSchool(system._id);
						break;
				}
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
		alert('Finished adding federal states to "systems"');
		await close();
	},

	down: async function down() {
		await connect();

		await systemModel
			.updateMany(
				{
					'ldapConfig.federalState': { $exists: true },
				},
				{ $unset: { 'ldapConfig.federalState': '' } }
			)
			.exec();

		alert('Finished removing federal states from "systems"');

		await close();
	},
};
