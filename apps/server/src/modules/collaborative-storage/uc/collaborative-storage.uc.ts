import { Injectable } from '@nestjs/common';
import { TeamPermissionsBody } from '../controller/dto/team-permissions.body.params';
import { TeamRoleDto } from '../controller/dto/team-role.params';
import { TeamPermissionsMapper } from '../mapper/team-permissions.mapper';
import { CollaborativeStorageService } from '../services/collaborative-storage.service';
import { TeamDto } from '../services/dto/team.dto';

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
	async updateUserPermissionsForRole(
		currentUserId: string,
		teamRole: TeamRoleDto,
		permissionsDto: TeamPermissionsBody
	): Promise<void> {
		return this.service.updateTeamPermissionsForRole(
			currentUserId,
			teamRole.teamId,
			teamRole.roleId,
			this.permissionMapper.mapBodyToDto(permissionsDto)
		);
	}

	deleteTeam(teamId: string): Promise<void> {
		return this.service.deleteTeam(teamId);
	}

	createTeam(team: TeamDto): Promise<void> {
		return this.service.createTeam(team);
	}

	updateTeam(team: TeamDto): Promise<void> {
		return this.service.updateTeam(team);
	}
}
