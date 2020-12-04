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

const findBulkParents = (parentRole, limit) => User.find({ roles: parentRole._id }).limit(limit).lean().exec();

const deleteParentUsersByIds = async (ids) => {
	const result = await User.deleteMany({
		_id: { $in: ids },
	}).exec();
	info(`${result.deletedCount} parent users deleted.`);
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

const bulkMigrateParentsToStudents = async () => {
	const parentRole = await getParentRole();
	let continueBulkProcess = true;
	const limit = 500;

	while (continueBulkProcess) {
		const parentIdsToDelete = [];
		const parents = await findBulkParents(parentRole, limit);
		if (!parents.length) {
			info('No more parents to process.');
			continueBulkProcess = false;
		} else {
			info(`${parents.length} parents will be processed...`);
			for (const parent of parents) {
				const students = await getStudentsForParent(parent);
				const studentIds = getIds(students);
				await updateStudentsParentData(studentIds, parent);
				parentIdsToDelete.push(parent._id);
			}
			await deleteParentUsersByIds(parentIdsToDelete);
		}
	}

	info(`Removing role: ${parentRole.name}`);
	await RoleModel.deleteOne({ _id: parentRole._id });
};

const findBulkStudentsWithParentData = (limit) =>
	User.find({ parents: { $elemMatch: { email: { $ne: null } } } })
		.limit(limit)
		.lean()
		.exec();

const bulkMigrateParentsFromStudents = async () => {
	let continueBulkProcess = true;
	const limit = 500;
	const parentRole = await RoleModel.create({ name: 'parent' });

	while (continueBulkProcess) {
		const students = await findBulkStudentsWithParentData(limit);
		if (!students.length) {
			info('No more students to process.');
			continueBulkProcess = false;
		} else {
			info(`${students.length} students will be processed...`);
			for (const student of students) {
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
				await OldUser.updateOne({ _id: student._id }, { $set: { parents: [parent._id] } });
				await OldUser.updateOne(
					{ _id: student._id, 'consent.parentConsents': { $exists: true } },
					{ $set: { 'consent.parentConsents.$[].parentId': parent._id } }
				);
			}
		}
	}
};

module.exports = {
	up: async function up() {
		await connect();
		await bulkMigrateParentsToStudents();
		await close();
	},

	down: async function down() {
		await connect();
		await bulkMigrateParentsFromStudents();
		await close();
	},
};
