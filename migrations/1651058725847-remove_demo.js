const mongoose = require('mongoose');
// eslint-disable-next-line no-unused-vars
const { alert, error, info } = require('../src/logger');

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

const rolesModelSearch = async (searchRoles) =>
	Roles.find({ roles: { $elemMatch: { $in: searchRoles } } })
		.lean()
		.exec();

const substitutRoles = async (srcRolesIDs, dstRolesIDs, useModelFnc) => {
	const list = await useModelFnc(srcRolesIDs);
	return list.map((elem) => {
		const testInclude = elem.roles.map((role) => objectStringArrayInclude(dstRolesIDs, role)).includes(true);
		if (!testInclude) {
			elem.roles = elem.roles.map((role) => (objectStringArrayInclude(srcRolesIDs, role) ? dstRolesIDs : role));
		} else {
			elem.roles = elem.roles.filter((role) => !objectStringArrayInclude(srcRolesIDs, role));
		}
		return elem;
	});
};

const removeRoles = async (srcRolesIDs, useModelFnc) => {
	const list = await useModelFnc(srcRolesIDs);
	return list.map((elem) => {
		elem.roles = elem.roles.filter((role) => !objectStringArrayInclude(srcRolesIDs, role));
		return elem;
	});
}

module.exports = {
	up: async function up() {
		await connect();
		const demoTeachers = await Roles.find({ name: 'demoTeacher' }).lean().exec();
		const demoTeachersIDs = demoTeachers.map((teacher) => teacher._id);
		const teachers = await Roles.find({ name: 'teacher' }).lean().exec();
		const teachersIDs = teachers.map((teacher) => teacher._id);
		const teacherList = await substitutRoles(demoTeachersIDs, teachersIDs, usersModelSearch);
		for (const user of teacherList) {
			// eslint-disable-next-line no-await-in-loop
			await Users.updateOne({ _id: user._id }, { roles: user.roles }).exec();
		}
		const subDemoTeacherRole = await substitutRoles(demoTeachersIDs, teachersIDs, rolesModelSearch);
		for (const role of subDemoTeacherRole) {
			// eslint-disable-next-line no-await-in-loop
			await Roles.updateOne({ _id: role._id }, { roles: role.roles }).exec();
		}
		await Roles.deleteMany({ _id: { $in: demoTeachersIDs } });

		const demoStudents = await Roles.find({ name: 'demoStudent' }).lean().exec();
		const demoStudentsIDs = demoStudents.map((student) => student._id);
		const students = await Roles.find({ name: 'student' }).lean().exec();
		const studentsIDs = students.map((student) => student._id);
		const studentsList = await substitutRoles(demoStudentsIDs, studentsIDs, usersModelSearch);
		for (const user of studentsList) {
			// eslint-disable-next-line no-await-in-loop
			await Users.updateOne({ _id: user._id }, { roles: user.roles }).exec();
		}
		const subDemoUserRole = await substitutRoles(demoStudentsIDs, studentsIDs, rolesModelSearch);
		for (const role of subDemoUserRole) {
			// eslint-disable-next-line no-await-in-loop
			await Roles.updateOne({ _id: role._id }, { roles: role.roles }).exec();
		}
		await Roles.deleteMany({ _id: { $in: demoStudentsIDs } });

		const demo = await Roles.find({ name: 'demo' }).lean().exec();
		const demoIDs = demo.map((role) => role._id);
		const demoUsers = await removeRoles(demoIDs, usersModelSearch);
		for (const user in demoUsers) {
			// eslint-disable-next-line no-await-in-loop
			await Users.updateOne({ _id: user._id }, { roles: user.roles }).exec();
		}
		const demoRoless = await removeRoles(demoIDs, rolesModelSearch);
		for (const role in demoRoless) {
			// eslint-disable-next-line no-await-in-loop
			await Roles.updateOne({ _id: role._id }, { roles: role.roles }).exec();
		}
		await Roles.deleteMany({ _id: { $in: demoIDs } });
		await close();
	},

	down: async function down() {
		await connect();
		const demoRole = [{
			'_id': '0000d186816abba584714d00',
			'name': 'demo',
			'permissions': [
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
			'_id': '0000d186816abba584714d02',
			'name': 'demoStudent',
			'permissions': [],
			roles: ['0000d186816abba584714d00'],
		},
		{
			'_id': '0000d186816abba584714d03',
			'name': 'demoTeacher',
			'permissions': [
				'LESSONS_VIEW',
				'SUBMISSIONS_SCHOOL_VIEW',
				'TOOL_NEW_VIEW',
			],
			roles: ['0000d186816abba584714d00'],
		},
		];
		await Roles.insertMany(demoRole);
		await close();
	},
};
