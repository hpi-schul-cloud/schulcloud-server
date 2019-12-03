// eslint-disable-next-line no-unused-vars
const { info, error } = require('../src/logger');

const { connect, close } = require('../src/utils/database');

const Role = require('../src/services/role/model');

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
			'STUDENT_CREATE', 'STUDENT_EDIT', 'STUDENT_DELETE',
			'TEACHER_CREATE', 'TEACHER_EDIT', 'TEACHER_DELETE',
			'CLASS_CREATE', 'CLASS_EDIT', 'CLASS_REMOVE',
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
				info(`updating role '${role}' finished with ${updated} modifications. Removed permissions:`, removedPersmissions);
				await currentRole.save();
				info('role updated successfully...');
			} else {
				info(`role '${role}' finished without modifications.`);
			}
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
