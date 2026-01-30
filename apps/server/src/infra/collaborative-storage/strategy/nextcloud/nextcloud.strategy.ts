import { LegacyLogger } from '@core/logger';
import { TeamDto, TeamUserDto } from '@modules/collaborative-storage';
import { PseudonymService } from '@modules/pseudonym';
import { Pseudonym } from '@modules/pseudonym/repo';
import { ExternalTool } from '@modules/tool/external-tool/domain';
import { ExternalToolService } from '@modules/tool/external-tool/service';
import { UserDo, UserService } from '@modules/user';
import { Injectable, UnprocessableEntityException } from '@nestjs/common';
import { NotFoundLoggableException } from '@shared/common/loggable-exception';
import { InternalCollaborativeStorageAdapterConfig } from '../../collaborative-storage-adapter.config';
import { TeamRolePermissionsDto } from '../../dto/team-role-permissions.dto';
import { CollaborativeStorageStrategy } from '../base.interface.strategy';
import { NextcloudClient } from './nextcloud.client';

/**
 * Nextcloud Strategy Implementation for Collaborative Storage
 *
 * @implements {CollaborativeStorageStrategy}
 */
@Injectable()
export class NextcloudStrategy implements CollaborativeStorageStrategy {
	constructor(
		private readonly logger: LegacyLogger,
		private readonly client: NextcloudClient,
		private readonly pseudonymService: PseudonymService,
		private readonly externalToolService: ExternalToolService,
		private readonly userService: UserService,
		private readonly config: InternalCollaborativeStorageAdapterConfig
	) {
		this.logger.setContext(NextcloudStrategy.name);
	}

	/**
	 * At the moment unused.
	 *
	 * @param dto
	 */
	async updateTeamPermissionsForRole(dto: TeamRolePermissionsDto): Promise<void> {
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

	/**
	 * Deletes a whole team in nextcloud.
	 *
	 * This includes the related group in nextcloud and the groupfolder of the group.
	 *
	 * @param teamId id of the schulcloud team
	 */
	async deleteTeam(teamId: string): Promise<void> {
		const groupId: string = this.client.getNameWithPrefix(teamId);
		if (groupId) {
			const folderId: number = await this.client.findGroupFolderIdForGroupId(groupId);
			await this.client.deleteGroup(groupId);
			await this.client.deleteGroupFolder(folderId);
		}
	}

	/**
	 * Creates a team in nextcloud.
	 *
	 * This includes the creation of the related group, its groupfolder and the adding of the {@link TeamUserDto teamUsers} (the creator).
	 *
	 * @param team schulcloud team
	 */
	async createTeam(team: TeamDto): Promise<void> {
		const groupId: string = this.client.getNameWithPrefix(team.id);

		await this.client.createGroup(groupId, team.name);

		await this.updateTeamUsersInGroup(groupId, team.teamUsers);

		const folderName: string = NextcloudStrategy.generateGroupFolderName(team.id, team.name);
		// TODO N21-124: move the creation of group folders from the schulcloud-nextcloud-app to here, when all existing teams are migrated to the nextcloud
		// Due to the schulcloud-nextcloud-app creating the group folder, when the group is created, it only needs to be renamed here
		const folderId: number = await this.client.findGroupFolderIdForGroupId(groupId);
		await this.client.changeGroupFolderName(folderId, folderName);
		// const folderId: number = await this.client.createGroupFolder(folderName);
		// await this.client.addAccessToGroupFolder(folderId, groupId);
	}

	/**
	 * Updates a team in nextcloud.
	 *
	 * This includes the {@link TeamUserDto teamuser} and the displayname of the team.
	 *
	 * @param team schulcloud team
	 */
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
	 * @param groupId nextclouds groupId
	 * @param teamUsers all users of a {@link TeamDto}
	 * @protected
	 */
	protected async updateTeamUsersInGroup(groupId: string, teamUsers: TeamUserDto[]): Promise<void[][]> {
		const groupUserIds: string[] = await this.client.getGroupUsers(groupId);
		const nextcloudTool: ExternalTool = await this.findNextcloudTool();

		let convertedTeamUserIds: string[] = await Promise.all<Promise<string>[]>(
			// The Oauth authentication generates a pseudonym which will be used from external systems as identifier
			teamUsers.map(async (teamUser: TeamUserDto): Promise<string> => {
				const user: UserDo = await this.userService.findById(teamUser.userId);
				const userId = await this.pseudonymService
					.findByUserAndToolOrThrow(user, nextcloudTool)
					.then((pseudonymDO: Pseudonym) => this.client.getNameWithPrefix(pseudonymDO.pseudonym))
					.catch(() => '');

				return userId;
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

	private async findNextcloudTool(): Promise<ExternalTool> {
		const tool: ExternalTool | null = await this.externalToolService.findExternalToolByName(
			this.config.oidcInternalName
		);

		if (!tool) {
			throw new NotFoundLoggableException(ExternalTool.name, { name: this.config.oidcInternalName });
		}

		return tool;
	}

	/**
	 * Generates the groupfolder name by concatenating the teamId and teamName.
	 *
	 * @param teamId id of the team
	 * @param teamName name of the team
	 * @protected
	 */
	protected static generateGroupFolderName(teamId: string, teamName: string): string {
		return `${teamName} (${teamId})`;
	}

	/**
	 * Generates groupId of the nextcloud group by concatenating some {@link TeamRolePermissionsDto} properties.
	 *
	 * @param dto
	 * @protected
	 */
	protected static generateGroupId(dto: TeamRolePermissionsDto): string {
		return `${dto.teamName}-${dto.teamId}-${dto.roleName}`;
	}
}
