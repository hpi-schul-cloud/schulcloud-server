import { Injectable, UnprocessableEntityException } from '@nestjs/common';
import { Logger } from '@src/core/logger';
import { PseudonymsRepo } from '@shared/repo/index';
import { TeamDto, TeamUserDto } from '@src/modules/collaborative-storage/services/dto/team.dto';
import { PseudonymDO } from '@shared/domain/index';
import { LtiToolRepo } from '@shared/repo/ltitool/index';
import { LtiToolDO } from '@shared/domain/domainobject/ltitool.do';
import { ICollaborativeStorageStrategy } from '../base.interface.strategy';
import { TeamRolePermissionsDto } from '../../dto/team-role-permissions.dto';
import { NextcloudClient } from './nextcloud.client';

/**
 * Nextcloud Strategy Implementation for Collaborative Storage
 *
 * @implements ICollaborativeStorageStrategy
 *
 */
@Injectable()
export class NextcloudStrategy implements ICollaborativeStorageStrategy {
	constructor(
		private readonly logger: Logger,
		private readonly client: NextcloudClient,
		private readonly pseudonymsRepo: PseudonymsRepo,
		private readonly ltiToolRepo: LtiToolRepo
	) {
		this.logger.setContext(NextcloudStrategy.name);
	}

	async updateTeamPermissionsForRole(dto: TeamRolePermissionsDto) {
		const groupId: string = await this.client.findGroupId(NextcloudStrategy.generateGroupId(dto));
		let folderId: number;

		try {
			folderId = await this.client.findGroupFolderIdForGroupId(groupId);
			await this.client.setGroupPermissions(groupId, folderId, dto.permissions);
		} catch (e) {
			this.logger.log(
				`Permissions in nextcloud were not set because of missing groupId or folderId for teamId ${dto.teamId}`
			);
		}
	}

	async deleteTeam(teamId: string): Promise<void> {
		const groupId: string = this.client.getNameWithPrefix(teamId);
		if (groupId) {
			const folderId: number = await this.client.findGroupFolderIdForGroupId(groupId);
			await this.client.deleteGroup(groupId);
			await this.client.deleteGroupFolder(folderId);
		}
	}

	async createTeam(team: TeamDto): Promise<void> {
		const groupId: string = this.client.getNameWithPrefix(team.id);

		// Due to the schulcloud-nextcloud-app, the group folder is created, when the group is created
		await this.client.createGroup(groupId, team.name);

		// TODO N21-124: use ad-hoc creation of group folders, when all existing teams are migrated to the nextcloud
		// The update 
		await this.updateTeam(team);

		// await this.updateTeamUsersInGroup(groupId, team.teamUsers);
		// const folderName: string = NextcloudStrategy.generateGroupFolderName(team.id, team.name);
		// const folderId: number = await this.client.createGroupFolder(folderName);
		// await this.client.addAccessToGroupFolder(folderId, groupId);
	}

	async updateTeam(team: TeamDto): Promise<void> {
		if (!team.id) {
			throw new UnprocessableEntityException('Cannot update team without id');
		}

		const groupId: string = this.client.getNameWithPrefix(team.id);

		if (team.teamUsers && team.teamUsers.length > 0) {
			await this.updateTeamUsersInGroup(groupId, team.teamUsers);
		}

		if (team.name) {
			const folderName: string = NextcloudStrategy.generateGroupFolderName(team.id, team.name);

			await this.client.renameGroup(groupId, team.name);

			const folderId: number = await this.client.findGroupFolderIdForGroupId(groupId);
			await this.client.changeGroupFolderName(folderId, folderName);
		}
	}

	/**
	 * Updating nextcloud group to be in sync with schulcloud team members.
	 *
	 * To do this, we have to get the link between the school cloud user ID and the Nextcloud user ID from the
	 * pseudonym table and distinguish between added and deleted users.
	 *
	 * @param groupId, nextclouds groupId
	 * @param teamUsers, all users of a {@link TeamDto}
	 * @protected
	 */
	protected async updateTeamUsersInGroup(groupId: string, teamUsers: TeamUserDto[]): Promise<void[][]> {
		const groupUserIds: string[] = await this.client.getGroupUsers(groupId);
		const nextcloudLtiTool: LtiToolDO = await this.ltiToolRepo.findByName(this.client.oidcInternalName);

		let convertedTeamUserIds: string[] = await Promise.all<Promise<string>[]>(
			teamUsers.map(async (teamUser: TeamUserDto): Promise<string> => {
				// The Oauth authentication generates a pseudonym which will be used from external systems as identifier
				return this.pseudonymsRepo
					.findByUserIdAndToolId(teamUser.userId, nextcloudLtiTool.id as string)
					.then((pseudonymDO: PseudonymDO) => this.client.getNameWithPrefix(pseudonymDO.pseudonym))
					.catch(() => '');
			})
		);
		convertedTeamUserIds = convertedTeamUserIds.filter(Boolean);

		const removeUserIds: string[] = groupUserIds.filter((userId) => !convertedTeamUserIds.includes(userId));
		this.logger.debug(`Removing nextcloud userIds [${removeUserIds.toString()}]`);
		const addUserIds: string[] = convertedTeamUserIds.filter((userId) => !groupUserIds.includes(userId));
		this.logger.debug(`Adding nextcloud userIds [${addUserIds.toString()}]`);

		return Promise.all([
			Promise.all(removeUserIds.map((nextcloudUserId) => this.client.removeUserFromGroup(nextcloudUserId, groupId))),
			Promise.all(addUserIds.map((nextcloudUserId) => this.client.addUserToGroup(nextcloudUserId, groupId))),
		]);
	}

	protected static generateGroupFolderName(teamId: string, teamName: string): string {
		return `${teamName} (${teamId})`;
	}

	protected static generateGroupId(dto: TeamRolePermissionsDto): string {
		return `${dto.teamName}-${dto.teamId}-${dto.roleName}`;
	}
}
