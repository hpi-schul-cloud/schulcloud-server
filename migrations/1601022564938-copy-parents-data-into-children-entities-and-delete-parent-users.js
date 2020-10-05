/* eslint-disable no-await-in-loop */
// eslint-disable-next-line no-unused-vars
const mongoose = require('mongoose');

const { info, error } = require('../src/logger');

const { connect, close } = require('../src/utils/database');

const parentSchema = new mongoose.Schema({
	firstName: { type: String, required: true },
	lastName: { type: String, required: true },
	email: { type: String, required: true, lowercase: true },
});

const consentForm = ['analog', 'digital', 'update'];

const RoleModel = mongoose.model(
	'myRoleModel_05102020',
	new mongoose.Schema({
		name: { type: String, required: true },
	}),
	'roles'
);

const OldUser = mongoose.model(
	'oldUser_05102020',
	new mongoose.Schema({
		parents: [{ type: mongoose.Schema.Types.ObjectId, ref: 'user' }],
		consent: {
			parentConsents: [
				{
					parentId: { type: mongoose.Schema.Types.ObjectId, ref: 'user' },
					form: { type: String, enum: consentForm },
					dateOfPrivacyConsent: { type: Date },
					dateOfTermsOfUseConsent: { type: Date },
					privacyConsent: { type: Boolean },
					termsOfUseConsent: { type: Boolean },
				},
			],
		},
	}),
	'users'
);

const User = mongoose.model(
	'myUserModel_05102020',
	new mongoose.Schema({
		roles: [{ type: mongoose.Schema.Types.ObjectId, ref: 'role' }],
		parents: [parentSchema],
		consent: {
			parentConsents: [
				{
					parentId: { type: mongoose.Schema.Types.ObjectId, ref: 'user' },
					form: { type: String, enum: consentForm },
					dateOfPrivacyConsent: { type: Date },
					dateOfTermsOfUseConsent: { type: Date },
					privacyConsent: { type: Boolean },
					termsOfUseConsent: { type: Boolean },
				},
			],
		},
	}),
	'users'
);

const getIds = (doc) =>
	doc.reduce((prev, curr) => {
		prev.push(curr._id);
		return prev;
	}, []);

const getParentRole = async () => RoleModel.findOne({ name: 'parent' }).lean().exec();

const findAllParents = async (parentRole) => User.find({ roles: parentRole._id }).lean().exec();

const deleteParentUsers = async (parentRole) => {
	const result = await User.deleteMany({ roles: parentRole._id }).exec();
	info(`${result.deletedCount} users deleted.`);
};

const getStudentsForParent = async (parent) => {
	const students = await OldUser.find({ parents: parent._id });
	info(`${students.length} students for parent with id=${parent._id} will be updated!`);
	return students;
};

const updateStudentsParentData = async (studentIds, parent) => {
	const updatedStudents = await User.updateMany(
		{ _id: { $in: [studentIds] } },
		{
			$set: {
				parents: [
					{
						firstName: parent.firstName,
						lastName: parent.lastName,
						email: parent.email,
					},
				],
			},
			$unset: { 'consent.parentConsents.$[].parentId': '' },
		}
	);
	return updatedStudents;
};

module.exports = {
	up: async function up() {
		await connect();
		// ////////////////////////////////////////////////////
		const parentRole = await getParentRole();
		const parents = await findAllParents(parentRole);
		for (const parent of parents) {
			const students = await getStudentsForParent(parent);
			const studentIds = getIds(students);
			await updateStudentsParentData(studentIds, parent);
		}
		await deleteParentUsers(parentRole);
		// ////////////////////////////////////////////////////
		await close();
	},

	down: async function down() {
		error('This migration cannot be rolled back and data needs to be restored from backups.');
	},
};
