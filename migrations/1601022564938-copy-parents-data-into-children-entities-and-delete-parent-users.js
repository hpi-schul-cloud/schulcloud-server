/* eslint-disable no-await-in-loop */
// eslint-disable-next-line no-unused-vars
const mongoose = require('mongoose');

const { info } = require('../src/logger');

const { connect, close } = require('../src/utils/database');

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
		firstName: { type: String, required: true },
		lastName: { type: String, required: true },
		email: { type: String, required: true, lowercase: true },
		schoolId: {
			type: mongoose.Schema.Types.ObjectId,
			ref: 'school',
			required: true,
			index: true,
		},
		parents: [
			{
				_id: false,
				firstName: { type: String, required: true },
				lastName: { type: String, required: true },
				email: { type: String, required: true, lowercase: true },
			},
		],
		children: [{ type: mongoose.Schema.Types.ObjectId, ref: 'user' }],
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

const getIds = (docs) => docs.map((doc) => doc._id);

const getParentRole = async () => RoleModel.findOne({ name: 'parent' }).lean().exec();

const findAllParents = (parentRole) => User.find({ roles: parentRole._id });

const deleteParentUsersByIds = async (ids) => {
	const result = await User.deleteMany({
		_id: { $in: ids },
	}).exec();
	info(`${result.deletedCount} users deleted.`);
};

const getStudentsForParent = async (parent) => {
	const students = await OldUser.find({ parents: parent._id }).lean().exec();
	info(`${students.length} students for parent with id=${parent._id} will be updated!`);
	return students;
};

const updateStudentsParentData = async (studentIds, parent) => {
	await User.updateMany(
		{ _id: { $in: studentIds } },
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
		}
	);

	await User.updateMany(
		{ _id: { $in: studentIds }, 'consent.parentConsents': { $exists: true } },
		{
			$unset: { 'consent.parentConsents.$[].parentId': '' },
		}
	);
};

const migrateParentsToStudents = async () => {
	const parentIdsToDelete = [];
	const parentRole = await getParentRole();
	const cursor = findAllParents(parentRole).cursor();
	const parentsCount = await findAllParents(parentRole).count().exec();
	info(`${parentsCount} users with role parent found!`);
	for (let parent = await cursor.next(); parent != null; parent = await cursor.next()) {
		const students = await getStudentsForParent(parent);
		const studentIds = getIds(students);
		await updateStudentsParentData(studentIds, parent);
		parentIdsToDelete.push(parent._id);
	}

	let amountOfParentsLeftToDelete = parentIdsToDelete.length;

	const limit = 500;
	while (amountOfParentsLeftToDelete !== 0) {
		const parentsToDelete = amountOfParentsLeftToDelete < limit ? amountOfParentsLeftToDelete : limit;
		await deleteParentUsersByIds(parentIdsToDelete.splice(0, parentsToDelete));
		amountOfParentsLeftToDelete -= parentsToDelete;
	}

	info(`Removing role: ${parentRole.name}`);
	await RoleModel.deleteOne({ _id: parentRole._id });
};

const findAllStudentsWithParentData = () => User.find({ parents: { $elemMatch: { email: { $ne: null } } } });

const migrateParentsFromStudents = async () => {
	const parentRole = await RoleModel.create({ name: 'parent' });
	const cursor = findAllStudentsWithParentData().cursor();
	for (let student = await cursor.next(); student != null; student = await cursor.next()) {
		const parent = await User.findOneAndUpdate(
			{
				email: student.parents[0].email,
				roles: parentRole._id,
			},
			{
				$set: {
					firstName: student.parents[0].firstName,
					lastName: student.parents[0].lastName,
					email: student.parents[0].email,
					schoolId: student.schoolId,
					children: [student._id],
					roles: [parentRole._id],
				},
			},
			{
				upsert: true,
				new: true,
			}
		);
		await OldUser.updateOne(
			{ _id: student._id },
			{ $set: { parents: [parent._id], 'consent.parentConsents.$[].parentId': parent._id } }
		);
	}
};

module.exports = {
	up: async function up() {
		await connect();
		await migrateParentsToStudents();
		await close();
	},

	down: async function down() {
		await connect();
		await migrateParentsFromStudents();
		await close();
	},
};
