import { TeamPermissionsMapper } from '@modules/collaborative-storage/mapper/team-permissions.mapper';
import { CollaborativeStorageService } from '@modules/collaborative-storage/services/collaborative-storage.service';
import { TeamDto } from '@modules/collaborative-storage/services/dto/team.dto';
import { Injectable } from '@nestjs/common';
import { TeamPermissionsBody } from '../controller/dto/team-permissions.body.params';
import { TeamRoleDto } from '../controller/dto/team-role.params';

@Injectable()
export class CollaborativeStorageUc {
	constructor(
		private readonly service: CollaborativeStorageService,
		private readonly permissionMapper: TeamPermissionsMapper
	) {}

	/**
	 * Sets the Permissions for the specified Role in a Team
	 * @param currentUserId The current User. Needs to be either the teamowner or an teamadmin
	 * @param teamRole The Team and Role to be altered
	 * @param permissionsDto The new permissions
	 */
	public async updateUserPermissionsForRole(
		currentUserId: string,
		teamRole: TeamRoleDto,
		permissionsDto: TeamPermissionsBody
	): Promise<void> {
		await this.service.updateTeamPermissionsForRole(
			currentUserId,
			teamRole.teamId,
			teamRole.roleId,
			this.permissionMapper.mapBodyToDto(permissionsDto)
		);
	}

	public deleteTeam(teamId: string): Promise<void> {
		return this.service.deleteTeam(teamId);
	}

	public createTeam(team: TeamDto): Promise<void> {
		return this.service.createTeam(team);
	}

	public updateTeam(team: TeamDto): Promise<void> {
		return this.service.updateTeam(team);
	}
}
