const mongoose = require('mongoose');
const { connect, close } = require('../src/utils/database');
const logger = require('../src/logger');

const FEDERALSTATE_ABBR = 'NI';
const PERMISSION = 'LERNSTORE_VIEW';
const ROLES = ['user'];
const PERMISSION_EXCEPTION = 'LERNSTORE_HIDE';
const ROLE_EXCEPTION = `student${FEDERALSTATE_ABBR}`;

logger.info(`This migration
- adds ${PERMISSION} permission to ${ROLES}  
- creates ${ROLE_EXCEPTION} role having ${PERMISSION_EXCEPTION} permission
- adds ${ROLE_EXCEPTION} role to users from ${FEDERALSTATE_ABBR} schools`);

const RoleModel = mongoose.model(
	'learnstoreRolesNI',
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

const UserModel = mongoose.model(
	'lernstoreUsersNI',
	new mongoose.Schema(
		{
			roles: [{ type: mongoose.Types.ObjectId, ref: 'role' }],
			schoolId: {
				type: mongoose.Types.ObjectId,
				ref: 'school',
				required: true,
				index: true,
			},
		},
		{
			timestamps: true,
		}
	),
	'users'
);

const SchoolModel = mongoose.model(
	'lernstoreSchoolsNI',
	new mongoose.Schema(
		{
			federalState: { type: mongoose.Types.ObjectId, ref: 'federalstate' },
		},
		{
			timestamps: true,
		}
	),
	'schools'
);

const FederalStateModel = mongoose.model(
	'lernstoreFederalstatesNI',
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

// logic for users who should get the exception permission
const getUsers = async () => {
	const studentRoleId = await RoleModel.findOne({
		name: 'student',
	})
		.select(['_id'])
		.lean()
		.exec();

	const stateId = await FederalStateModel.findOne(
		{
			abbreviation: FEDERALSTATE_ABBR,
		},
		'_id'
	)
		.lean()
		.exec();

	const schoolsInState = await SchoolModel.find(
		{
			federalState: mongoose.Types.ObjectId(stateId._id),
		},
		'_id'
	)
		.lean()
		.exec();

	const schools = [];
	schoolsInState.forEach((school) => {
		schools.push(mongoose.Types.ObjectId(school._id));
	});

	const studentsInState = await UserModel.find(
		{
			roles: studentRoleId,
			schoolId: { $in: schools },
		},
		'_id'
	)
		.lean()
		.exec();

	const students = [];
	studentsInState.forEach((student) => {
		students.push(mongoose.Types.ObjectId(student._id));
	});

	return students;
};

const createRoleExcept = async () => {
	await RoleModel.create({
		name: ROLE_EXCEPTION,
		roles: [],
		permissions: [PERMISSION_EXCEPTION],
	});
};

const removeRoleExcept = async () => {
	await RoleModel.deleteOne({
		name: ROLE_EXCEPTION,
	});
};

const addRoleToUsers = async () => {
	const roleExcept = await RoleModel.findOne({
		name: ROLE_EXCEPTION,
	})
		.select(['_id'])
		.lean()
		.exec();

	const users = await getUsers();

	await UserModel.updateMany(
		{
			_id: { $in: users },
		},
		{
			$addToSet: {
				roles: {
					$each: [mongoose.Types.ObjectId(roleExcept._id)],
				},
			},
		}
	);
};

const removeRoleFromUsers = async () => {
	const roleExcept = await RoleModel.findOne({
		name: ROLE_EXCEPTION,
	})
		.select(['_id'])
		.lean()
		.exec();

	const users = await getUsers();

	await UserModel.updateMany(
		{
			_id: { $in: users },
		},
		{
			$pull: {
				roles: mongoose.Types.ObjectId(roleExcept._id),
			},
		}
	);
};

const addPermissionToRoles = async () => {
	await RoleModel.updateMany({ name: { $in: ROLES } }, { $addToSet: { permissions: PERMISSION } });
};

const removePermissionFromRoles = async () => {
	await RoleModel.updateMany({ name: { $in: ROLES } }, { $pull: { permissions: PERMISSION } });
};

module.exports = {
	up: async function up() {
		await connect();

		await addPermissionToRoles();

		await createRoleExcept();

		await addRoleToUsers();

		await close();
	},

	down: async function down() {
		await connect();

		await removePermissionFromRoles();

		await removeRoleExcept();

		await removeRoleFromUsers();

		await close();
	},
};
