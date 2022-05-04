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

module.exports = {
	up: async function up() {
		await connect();
		const demoTeachers = await Roles.find({ name: 'demoTeacher' }).lean().exec();
		const demoTeachersIDs = demoTeachers.map((teacher) => teacher._id);
		const demoStudents = await Roles.find({ name: 'demoStudent' }).lean().exec();
		const demoStudentsIDs = demoStudents.map((student) => student._id);
		const teachers = await Roles.find({ name: 'teacher' }).lean().exec();
		const teachersIDs = teachers.map((teacher) => teacher._id);
		const students = await Roles.find({ name: 'student' }).lean().exec();
		const studentsIDs = students.map((student) => student._id);
		const teacherList = await substitutRoles(demoTeachersIDs, teachersIDs, usersModelSearch);
		for (const user of teacherList) {
			// eslint-disable-next-line no-await-in-loop
			await Users.updateOne({ _id: user._id }, { roles: user.roles }).exec();
		}
		const studentsList = await substitutRoles(demoStudentsIDs, studentsIDs, usersModelSearch);
		for (const user of studentsList) {
			// eslint-disable-next-line no-await-in-loop
			await Users.updateOne({ _id: user._id }, { roles: user.roles }).exec();
		}
		const subDemoTeacherRole = await substitutRoles(demoTeachersIDs, teachersIDs, rolesModelSearch);
		for (const role of subDemoTeacherRole) {
			// eslint-disable-next-line no-await-in-loop
			await Roles.updateOne({ _id: role._id }, { roles: role.roles }).exec();
		}
		await Roles.deleteMany({ _id: { $in: demoTeachersIDs } });
		const subDemoUserRole = await substitutRoles(demoStudentsIDs, studentsIDs, rolesModelSearch);
		for (const role of subDemoUserRole) {
			// eslint-disable-next-line no-await-in-loop
			await Roles.updateOne({ _id: role._id }, { roles: role.roles }).exec();
		}
		await Roles.deleteMany({ _id: { $in: demoStudentsIDs } });
		await close();
	},

	down: async function down() {
		await connect();
		await close();
	},
};
