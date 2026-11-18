import { Migration } from '@mikro-orm/migrations-mongodb';

const TEAM_ROLE_NAMES = ['teammember', 'teamexpert', 'teamleader', 'teamadministrator', 'teamowner'];

const TEAM_PERMISSIONS = [
	'TEAM_VIEW',
	'TEAM_CREATE',
	'TEAM_EDIT',
	'TEAM_INVITE_EXTERNAL',
	'SCHOOL_STUDENT_TEAM_MANAGE',
	'CHANGE_TEAM_ROLES',
	'RENAME_TEAM',
	'LEAVE_TEAM',
	'DELETE_TEAM',
	'TEAM_EXPORT_TO_ROOM',
];

export class Migration20261109173119 extends Migration {
	public async up(): Promise<void> {
		await this.renameTeamsToTeamsIds();
		await this.deleteTeamNews();
		await this.removeTeamRolesAndPermissions();
		await this.removeStudentTeamCreationFlag();
	}

	public down(): Promise<void> {
		console.info('Removal of the teams feature data can not be reverted.');
		return Promise.resolve();
	}

	// ---------

	private async renameTeamsToTeamsIds(): Promise<void> {
		// code was removed because of strange side effects
		// original intention is now carried by Migration20261112160434
	}

	private async deleteTeamNews(): Promise<void> {
		const result = await this.getCollection('news').deleteMany({ targetModel: 'teams' });

		console.info(`Deleted ${result.deletedCount} team news.`);
	}

	private async removeTeamRolesAndPermissions(): Promise<void> {
		const roles = this.getCollection('roles');
		const teamRoleIds = (
			await roles.find({ name: { $in: TEAM_ROLE_NAMES } }, { projection: { _id: 1 } }).toArray()
		).map((role) => role._id);

		// Remove all references first so that no role or user points to a deleted role.
		await roles.updateMany({ roles: { $in: teamRoleIds } }, { $pull: { roles: { $in: teamRoleIds } } } as Record<
			string,
			unknown
		>);

		// Remove team roles from users (unprobable but possible)
		await this.getCollection('users').updateMany({ roles: { $in: teamRoleIds } }, {
			$pull: { roles: { $in: teamRoleIds } },
		} as Record<string, unknown>);

		// Delete team roles
		const deleteResult = await roles.deleteMany({ _id: { $in: teamRoleIds } });

		// Remove team permissions from remainingroles (unprobable but possible)
		const permissionResult = await roles.updateMany({ permissions: { $in: TEAM_PERMISSIONS } }, {
			$pull: { permissions: { $in: TEAM_PERMISSIONS } },
		} as Record<string, unknown>);

		console.info(
			`Deleted ${deleteResult.deletedCount} team roles, removed team permissions from ${permissionResult.modifiedCount} roles.`
		);
	}

	private async removeStudentTeamCreationFlag(): Promise<void> {
		const result = await this.getCollection('schools').updateMany(
			{ $or: [{ enableStudentTeamCreation: { $exists: true } }, { features: 'isTeamCreationByStudentsEnabled' }] },
			{ $unset: { enableStudentTeamCreation: '' }, $pull: { features: 'isTeamCreationByStudentsEnabled' } } as Record<
				string,
				unknown
			>
		);

		console.info(`Removed the student team creation flag from ${result.modifiedCount} schools.`);
	}
}
