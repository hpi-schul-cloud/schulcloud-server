const mongoose = require('mongoose');
// eslint-disable-next-line no-unused-vars
const logger = require('../src/logger');

const { connect, close } = require('../src/utils/database');

const RoleModel = mongoose.model(
	'learnstoreRoles',
	new mongoose.Schema(
		{
			name: { type: String, required: true },
			permissions: [{ type: String }],
			roles: [{ type: mongoose.Types.ObjectId }],
		},
		{
			timestamps: true,
		}
	),
	'roles'
);

const SchoolModel = mongoose.model(
	'lernstoreSchools',
	new mongoose.Schema(
		{
			federalState: { type: mongoose.Types.ObjectId, ref: 'federalstate' },
			permissions: { type: Object },
		},
		{
			timestamps: true,
		}
	),
	'schools'
);

const FederalStateModel = mongoose.model(
	'lernstoreFederalstates',
	new mongoose.Schema(
		{
			abbreviation: { type: String, required: true },
		},
		{
			timestamps: true,
		}
	),
	'federalstates'
);

const addPermissionToRoles = async () => {
	await RoleModel.updateMany({ name: 'user' }, { $addToSet: { permissions: 'LERNSTORE_VIEW' } });
};

const removePermissionFromRoles = async () => {
	await RoleModel.updateMany({ name: 'user' }, { $pull: { permissions: 'LERNSTORE_VIEW' } });
};

const addPermissionToSchools = async (stateAbbr) => {
	const stateId = await FederalStateModel.findOne({ abbreviation: stateAbbr }, '_id').lean().exec();
	try {
		await SchoolModel.updateMany(
			{
				federalState: mongoose.Types.ObjectId(stateId._id),
			},
			{
				$set: {
					'permissions.student.LERNSTORE_VIEW': false,
				},
			}
		);
	} catch (err) {
		logger.error(err);
		throw new Error(err);
	}
};

const removePermissionFromSchools = async (stateAbbr) => {
	const stateId = await FederalStateModel.findOne({ abbreviation: stateAbbr }, '_id').lean().exec();
	try {
		await SchoolModel.updateMany(
			{
				federalState: mongoose.Types.ObjectId(stateId._id),
			},
			{
				$unset: {
					'permissions.student.LERNSTORE_VIEW': false,
				},
			}
		);
	} catch (err) {
		logger.error(err);
		throw new Error(err);
	}
};

module.exports = {
	up: async function up() {
		await connect();

		await addPermissionToRoles();

		await addPermissionToSchools('SH');
		await addPermissionToSchools('NI');

		await close();
	},

	down: async function down() {
		await connect();

		await removePermissionFromRoles();

		await removePermissionFromSchools('SH');
		await removePermissionFromSchools('NI');

		await close();
	},
};
