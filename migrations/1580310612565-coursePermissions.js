const mongoose = require('mongoose');
// eslint-disable-next-line no-unused-vars
const { info, error } = require('../src/logger');

const { connect, close } = require('../src/utils/database');

const { Schema } = mongoose;

const roleSchema = new Schema(
	{
		name: { type: String, required: true },
		permissions: [{ type: String }],

		// inheritance
		roles: [{ type: Schema.Types.ObjectId }],
	},
	{
		timestamps: true,
	}
);

const roleModel = mongoose.model('role3245', roleSchema, 'roles');

module.exports.up = async function courseStudentUp(next) {
	await connect();
	const courseStudentRole = await roleModel.findOne({ name: 'courseStudent' }).exec();
	const toUpdateRoles = ['courseTeacher', 'courseSubstitutionTeacher'];
	toUpdateRoles.forEach(async (role) => {
		await roleModel.findOneAndUpdate({ name: role }, { roles: [courseStudentRole._id.toString()] }).exec();
	});

	const courseTeacherRole = await roleModel.findOne({ name: 'courseTeacher' }).exec();
	await roleModel
		.findOneAndUpdate({ name: 'courseAdministrator' }, { roles: [courseTeacherRole._id.toString()] })
		.exec();

	await close();

	next();
};

module.exports.down = function courseStudentDown(next) {
	next();
};
