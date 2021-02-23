const mongoose = require('mongoose');
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

const Role = mongoose.model('role3243', roleSchema, 'roles');

// How to use more than one schema per collection on mongodb
// https://stackoverflow.com/questions/14453864/use-more-than-one-schema-per-collection-on-mongodb

module.exports = {
	up: async function up() {
		await connect();

		const roleNames = ['teacher', 'administrator', 'superhero'];
		for (const roleName of roleNames) {
			info(`add permission CLASS_LIST for role ${roleName}`);
			const role = await Role.findOne({ name: roleName }).exec();
			if (role.permissions.includes('CLASS_LIST')) {
				info('teacher already has permission CLASS_LIST, ignore...');
			} else {
				info(`add permission CLASS_LIST for ${roleName}...`);
				role.permissions.push('CLASS_LIST');
				role.permissions.sort();
				await role.save();
				info(`${roleName} updated successfully, continue...`);
			}
		}

		if (process.env.SC_THEME !== 'thr') {
			info('no further updates required, this migration continues only iff SC_THEME is set to "thr"');
			await close();
			return Promise.resolve();
		}

		const roles = ['user', 'student', 'teacher', 'administrator'];
		const permissions = [
			'STUDENT_CREATE',
			'STUDENT_EDIT',
			'STUDENT_DELETE',
			'TEACHER_CREATE',
			'TEACHER_EDIT',
			'TEACHER_DELETE',
			'CLASS_CREATE',
			'CLASS_EDIT',
			'CLASS_REMOVE',
			'STUDENT_SKIP_REGISTRATION',
			'SYSTEM_CREATE',
			'SYSTEM_EDIT',
		];

		info('remove permissions from users iff existing...', { roles, permissions });

		for (const role of roles) {
			let updated = 0;
			const removedPersmissions = [];
			info(`updating role '${role}'...`);
			const currentRole = await Role.findOne({ name: role }).exec();
			if (currentRole === null) {
				error(`role '${role}} not found - ignore...`);
				break;
			}
			for (const permission of permissions) {
				if (currentRole.permissions.includes(permission)) {
					currentRole.permissions.pull(permission);
					updated += 1;
					removedPersmissions.push(permission);
				}
			}
			if (updated !== 0) {
				info(
					`updating role '${role}' finished with ${updated} modifications. ` + 'Removed permissions:',
					removedPersmissions
				);
				await currentRole.save();
				info('role updated successfully...');
			} else {
				info(`role '${role}' finished without modifications.`);
			}
		}

		info("add 'SYSTEM_CREATE', 'SYSTEM_EDIT', to superhero in SC_THEME=thr");

		const superHero = await Role.findOne({ name: 'superhero' }).exec();
		info('current superhero permissions are', superHero.permissions);
		let superHeroUpdated = false;
		if (!superHero.permissions.includes('SYSTEM_CREATE')) {
			info('add SYSTEM_CREATE permission to superhero');
			superHero.permissions.push('SYSTEM_CREATE');
			superHeroUpdated = true;
		}
		if (!superHero.permissions.includes('SYSTEM_EDIT')) {
			info('add SYSTEM_EDIT permission to superhero');
			superHero.permissions.push('SYSTEM_EDIT');
			superHeroUpdated = true;
		}
		if (superHeroUpdated) {
			superHero.permissions.sort();
			await superHero.save();
			info('superHero permissions updated successfully to', superHero.permissions);
		} else {
			info('no more permissions added to superhero');
		}

		info('permissions updated, done');

		await close();
		return Promise.resolve();
	},

	down: async function down() {
		await connect();
		// ////////////////////////////////////////////////////
		// Implement the necessary steps to roll back the migration here.
		error('there is no rollback possible, check up log...');
		// ////////////////////////////////////////////////////
		await close();
		return Promise.resolve();
	},
};
