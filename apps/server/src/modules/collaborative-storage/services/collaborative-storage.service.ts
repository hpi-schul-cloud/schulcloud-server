import { LegacyLogger } from '@core/logger';
import { CollaborativeStorageAdapter } from '@infra/collaborative-storage';
import { AuthorizationContextBuilder, AuthorizationService } from '@modules/authorization';
import { RoleService } from '@modules/role/service/role.service';
import { TeamRepo } from '@modules/team/repo';
import { Injectable } from '@nestjs/common';
import { Permission } from '@shared/domain/interface';
import { EntityId } from '@shared/domain/types';
import { TeamMapper } from '../mapper/team.mapper';
import { TeamPermissionsDto } from './dto/team-permissions.dto';
import { TeamDto } from './dto/team.dto';

@Injectable()
export class CollaborativeStorageService {
	constructor(
		private adapter: CollaborativeStorageAdapter,
		private roleService: RoleService,
		private teamsMapper: TeamMapper,
		private teamRepo: TeamRepo,
		private authService: AuthorizationService,
		private logger: LegacyLogger
	) {
		this.logger.setContext(CollaborativeStorageService.name);
	}

	/**
	 * Find a Team by its Id and return the DTO
	 * @param teamId The TeamId
	 * @param populate Decide, if you want to populate the Users in the Entity
	 * @return The mapped DTO
	 */
	async findTeamById(teamId: EntityId, populate = false): Promise<TeamDto> {
		return this.teamsMapper.mapEntityToDto(await this.teamRepo.findById(teamId, populate));
	}

	/**
	 * Sets the Permissions for the specified Role in a Team
	 * @param currentUserId The current User. Needs to be either the teamowner or an teamadmin
	 * @param teamId The TeamId
	 * @param roleId The RoleId
	 * @param teamPermissions The new Permissions
	 */
	async updateTeamPermissionsForRole(
		currentUserId: string,
		teamId: string,
		roleId: string,
		teamPermissions: TeamPermissionsDto
	): Promise<void> {
		this.authService.checkPermission(
			await this.authService.getUserWithPermissions(currentUserId),
			await this.teamRepo.findById(teamId, true),
			AuthorizationContextBuilder.write([Permission.CHANGE_TEAM_ROLES])
		);
		return this.adapter.updateTeamPermissionsForRole(
			await this.findTeamById(teamId, true),
			await this.roleService.findById(roleId),
			teamPermissions
		);
	}

	deleteTeam(teamId: string): Promise<void> {
		return this.adapter.deleteTeam(teamId);
	}

	createTeam(team: TeamDto): Promise<void> {
		return this.adapter.createTeam(team);
	}

	updateTeam(team: TeamDto): Promise<void> {
		return this.adapter.updateTeam(team);
	}
}
