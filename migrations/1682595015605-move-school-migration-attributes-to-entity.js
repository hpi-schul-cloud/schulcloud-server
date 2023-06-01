const mongoose = require('mongoose');
// eslint-disable-next-line no-unused-vars
const { alert, error } = require('../src/logger');

const { Schema } = mongoose;

const { connect, close } = require('../src/utils/database');

// use your own name for your model, otherwise other migrations may fail.
// The third parameter is the actually relevent one for what collection to write to.
const System = mongoose.model(
	'system1682595015605',
	new mongoose.Schema(
		{
			_id: { type: Schema.Types.ObjectId, required: true },
			alias: { type: String, required: true },
		},
		{
			timestamps: true,
		}
	),
	'systems'
);

const School = mongoose.model(
	'school1682595015605',
	new mongoose.Schema(
		{
			_id: { type: Schema.Types.ObjectId, required: true },
			oauthMigrationStart: { type: Date },
			oauthMigrationPossible: { type: Date },
			oauthMigrationMandatory: { type: Date },
			oauthMigrationFinished: { type: Date },
			oauthMigrationFinalFinish: { type: Date },
			systems: [{ type: Schema.Types.ObjectId, ref: 'systems' }],
		},
		{
			timestamps: true,
		}
	),
	'schools'
);

const UserLoginMigration = mongoose.model(
	'user_login_migration1682595015605',
	new mongoose.Schema(
		{
			school: { type: Schema.Types.ObjectId, ref: 'schools', required: true },
			sourceSystem: { type: Schema.Types.ObjectId, ref: 'systems' },
			targetSystem: { type: Schema.Types.ObjectId, ref: 'systems', required: true },
			mandatorySince: { type: Date },
			startedAt: { type: Date, required: true },
			closedAt: { type: Date },
			finishedAt: { type: Date },
		},
		{
			timestamps: true,
		}
	),
	'user_login_migrations'
);

// How to use more than one schema per collection on mongodb
// https://stackoverflow.com/questions/14453864/use-more-than-one-schema-per-collection-on-mongodb
module.exports = {
	up: async function up() {
		await connect();

		// Find all schools that have a migration
		const schools = await School.find({
			oauthMigrationStart: { $exists: true },
		})
			.lean()
			.exec();

		if ((schools || []).length === 0) {
			alert('No school with user login migration found. Nothing to migrate.');
			return;
		}

		alert(`Found ${schools.length} school(s) for update.`);

		// Find migration target system
		const targetSystem = await System.findOne({
			alias: 'SANIS',
		})
			.lean()
			.exec();

		if (!targetSystem) {
			error(`Cannot find SANIS system, but ${schools.length} school(s) have a migration and need to be migrated.`);
			return;
		}

		// Map old attributes to new documents
		const userLoginMigrations = schools.map((school) => {
			// Find schools source system
			const schoolSystems = (school.systems || []).filter((systemId) => systemId !== targetSystem._id);
			const sourceSystem = schoolSystems.length >= 1 ? schoolSystems[0] : undefined;

			return {
				school: school._id,
				sourceSystem,
				targetSystem: targetSystem._id,
				mandatorySince: school.oauthMigrationMandatory,
				startedAt: school.oauthMigrationStart,
				closedAt: school.oauthMigrationFinished,
				finishedAt: school.oauthMigrationFinalFinish,
			};
		});

		alert(userLoginMigrations);

		// Save new documents
		await UserLoginMigration.insertMany(userLoginMigrations);

		alert(`Created ${userLoginMigrations.length} UserLoginMigration(s)`);

		// Remove old attributes
		await School.updateMany(
			{},
			{
				$unset: {
					oauthMigrationStart: '',
					oauthMigrationPossible: '',
					oauthMigrationMandatory: '',
					oauthMigrationFinished: '',
					oauthMigrationFinalFinish: '',
				},
			}
		);

		await close();
	},

	down: async function down() {
		await connect();

		// Find all schools that have a migration
		const userLoginMigrations = await UserLoginMigration.find({}).lean().exec();

		if ((userLoginMigrations || []).length === 0) {
			alert('No user login migrations found. Nothing to roll back.');
			return;
		}

		alert(`Found ${userLoginMigrations.length} UserLoginMigration(s) to roll back.`);

		await Promise.all(
			userLoginMigrations.map(async (userLoginMigration) => {
				await School.findByIdAndUpdate(userLoginMigration.school, {
					oauthMigrationStart: userLoginMigration.startedAt,
					oauthMigrationPossible: !userLoginMigration.closedAt ? userLoginMigration.startedAt : undefined,
					oauthMigrationMandatory: userLoginMigration.mandatorySince,
					oauthMigrationFinished: userLoginMigration.closedAt,
					oauthMigrationFinalFinish: userLoginMigration.finishedAt,
				});
			})
		);

		await UserLoginMigration.db.dropCollection('user_login_migrations');

		await close();
	},
};
