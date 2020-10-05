/* eslint-disable no-await-in-loop */
// eslint-disable-next-line no-unused-vars
const mongoose = require('mongoose');

const { info } = require('../src/logger');

const { connect, close } = require('../src/utils/database');

const parentSchema = new mongoose.Schema({
	firstName: { type: String, required: true },
	lastName: { type: String, required: true },
	email: { type: String, required: true, lowercase: true },
});

const consentForm = ['analog', 'digital', 'update'];

const OldUser = mongoose.model(
	'oldUser',
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
	'myUserModel',
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

const findAllParents = async () =>
	User.aggregate([
		{
			$lookup: {
				from: 'roles',
				localField: 'roles',
				foreignField: '_id',
				as: 'rolesLookup',
			},
		},
		{ $match: { 'rolesLookup.name': 'parent' } },
	]);

const deleteParentUsers = (parents) => {
	const idsToDelete = getIds(parents);
	info(`${idsToDelete.length} parent users will be deleted!`);
	return User.deleteMany({ _id: { $in: [idsToDelete] } });
};

const getStudentsForParent = async (parent) => {
	const students = await OldUser.find({
		parents: parent._id,
	});
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

// How to use more than one schema per collection on mongodb
// https://stackoverflow.com/questions/14453864/use-more-than-one-schema-per-collection-on-mongodb

// TODO npm run migration-persist and remove this line
// TODO update seed data and remove this line

module.exports = {
	up: async function up() {
		await connect();
		// ////////////////////////////////////////////////////
		const parents = await findAllParents();
		for (const parent of parents) {
			const students = await getStudentsForParent(parent);
			const studentIds = getIds(students);
			await updateStudentsParentData(studentIds, parent);
		}
		await deleteParentUsers(parents);
		// ////////////////////////////////////////////////////
		await close();
	},

	down: async function down() {
		error('This migration cannot be rolled back and data needs to be restored from backups.');
	},
};
