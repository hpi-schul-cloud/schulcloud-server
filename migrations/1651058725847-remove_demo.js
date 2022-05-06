const mongoose = require('mongoose');
const { info } = require('../src/logger');

const { connect, close } = require('../src/utils/database');

const Roles = mongoose.model(
	'Roles20220427',
	new mongoose.Schema(
		{
			name: { type: String, required: true },
			permissions: [{ type: String }],
			roles: [{ type: mongoose.Schema.Types.ObjectId }],
		},
		{
			timestamps: true,
		}
	),
	'roles'
);

const Users = mongoose.model(
	'Users20220427',
	new mongoose.Schema(
		{
			roles: [{ type: mongoose.Schema.Types.ObjectId }],
		},
		{
			timestamps: true,
		}
	),
	'users'
);

const objectStringArrayInclude = (inputArray, searchVaule) =>
	inputArray.map((inVal) => String(inVal) === String(searchVaule)).includes(true);

const usersModelSearch = async (searchRoles) =>
	Users.find({ roles: { $elemMatch: { $in: searchRoles } } })
		.lean()
		.exec();

const userUpdate = async (user) => Users.updateOne({ _id: user._id }, { roles: user.roles }).exec();

const rolesModelSearch = async (searchRoles) =>
	Roles.find({ roles: { $elemMatch: { $in: searchRoles } } })
		.lean()
		.exec();

const roleUpdate = async (role) => Roles.updateOne({ _id: role._id }, { roles: role.roles }).exec();

const rolesDelete = async (roles) => Roles.deleteMany({ _id: { $in: roles } });

const substitutRoles = async (srcRolesIDs, dstRolesIDs, searchFnc, updateFnc) => {
	const list = await searchFnc(srcRolesIDs);
	await Promise.all(
		list.map(async (elem) => {
			elem.roles = elem.roles.filter((role) => !objectStringArrayInclude(srcRolesIDs, role));
			elem.roles = elem.roles.filter((role) => !objectStringArrayInclude(dstRolesIDs, role));
			elem.roles = [elem.roles, dstRolesIDs];
			elem.roles = elem.roles.flat();
			await updateFnc(elem);
		})
	);
};

const removeRole = async (srcRolesIDs, searchFnc, updateFnc) => {
	const list = await searchFnc(srcRolesIDs);
	await Promise.all(
		list.map(async (elem) => {
			elem.roles = elem.roles.filter((role) => !objectStringArrayInclude(srcRolesIDs, role));
			await updateFnc(elem);
		})
	);
};

const replaceRoles = async (srcName, dstName) => {
	const srcRoles = await Roles.find({ name: srcName }).lean().exec();
	const srcRolesIDs = srcRoles.map((role) => role._id);
	const dstRoles = await Roles.find({ name: dstName }).lean().exec();
	const dstRolesIDs = dstRoles.map((role) => role._id);
	await substitutRoles(srcRolesIDs, dstRolesIDs, usersModelSearch, userUpdate);
	info(`All User with the role ${srcName} are upgraded to ${dstName}`);
	await substitutRoles(srcRolesIDs, dstRolesIDs, rolesModelSearch, roleUpdate);
	info(`No role inherit from the ${srcName} role more.`);
	await rolesDelete(srcRolesIDs);
	info(`The ${srcName} role is removed.`);
};

const removeRoles = async (srcName) => {
	const srcRoles = await Roles.find({ name: srcName }).lean().exec();
	const srcRolesIDs = srcRoles.map((role) => role._id);
	await removeRole(srcRolesIDs, usersModelSearch, userUpdate);
	info(`The ${srcName} role are removed from all Users.`);
	await removeRole(srcRolesIDs, rolesModelSearch, roleUpdate);
	info(`No role inherit from the ${srcName} role more.`);
	await rolesDelete(srcRolesIDs);
	info(`The ${srcName} role is removed.`);
};

module.exports = {
	up: async function up() {
		await connect();
		await replaceRoles('demoTeacher', 'teacher');
		await replaceRoles('demoStudent', 'student');
		await removeRoles('demo');
		await close();
	},

	down: async function down() {
		await connect();
		const demoRole = [
			{
				_id: '0000d186816abba584714d00',
				name: 'demo',
				permissions: [
					'BASE_VIEW',
					'CALENDAR_VIEW',
					'CLASS_VIEW',
					'COURSE_VIEW',
					'CONTENT_VIEW',
					'DASHBOARD_VIEW',
					'FILESTORAGE_CREATE',
					'FILESTORAGE_VIEW',
					'HOMEWORK_VIEW',
					'NEWS_VIEW',
					'RELEASES_VIEW',
					'SUBMISSIONS_VIEW',
					'TEAM_VIEW',
					'TOOL_VIEW',
					'TOPIC_VIEW',
				],
				roles: [],
			},
			{
				_id: '0000d186816abba584714d02',
				name: 'demoStudent',
				permissions: [],
				roles: ['0000d186816abba584714d00'],
			},
			{
				_id: '0000d186816abba584714d03',
				name: 'demoTeacher',
				permissions: ['LESSONS_VIEW', 'SUBMISSIONS_SCHOOL_VIEW', 'TOOL_NEW_VIEW'],
				roles: ['0000d186816abba584714d00'],
			},
		];
		await Roles.insertMany(demoRole);
		await close();
	},
};
