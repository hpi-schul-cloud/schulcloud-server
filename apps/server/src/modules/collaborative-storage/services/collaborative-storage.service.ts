import { Injectable } from '@nestjs/common';
import { EntityId, Permission, PermissionContextBuilder } from '@shared/domain';
import { RoleRepo, TeamsRepo } from '@shared/repo';
import { CollaborativeStorageAdapter } from '@shared/infra/collaborative-storage';
import { NextcloudStrategy } from '@shared/infra/collaborative-storage/strategy/nextcloud.strategy';
import { AuthorizationService } from '@src/modules/authorization';
import { RoleMapper } from '../mapper/role.mapper';
import { TeamMapper } from '../mapper/team.mapper';
import { RoleDto } from './dto/role.dto';
import { TeamPermissionsDto } from './dto/team-permissions.dto';
import { TeamDto } from './dto/team.dto';

@Injectable()
export class CollaborativeStorageService {
	constructor(
		private adapter: CollaborativeStorageAdapter,
		private roleRepo: RoleRepo,
		private teamsMapper: TeamMapper,
		private roleMapper: RoleMapper,
		private teamsRepo: TeamsRepo,
		private authService: AuthorizationService
	) {
		this.adapter.setStrategy(new NextcloudStrategy());
	}

	async findTeamById(teamId: EntityId, populate = false): Promise<TeamDto> {
		return this.teamsMapper.mapEntityToDto(await this.teamsRepo.findById(teamId, populate));
	}

	async findRoleById(roleId: EntityId): Promise<RoleDto> {
		return this.roleMapper.mapEntityToDto(await this.roleRepo.findById(roleId));
	}

	async updateTeamPermissionsForRole(
		currentUserId: string,
		teamId: string,
		roleId: string,
		teamPermissions: TeamPermissionsDto
	): Promise<void> {
		this.authService.checkPermission(
			await this.authService.getUserWithPermissions(currentUserId),
			await this.teamsRepo.findById(teamId, true),
			PermissionContextBuilder.permissionOnly([Permission.CHANGE_TEAM_ROLES])
		);
		this.adapter.updateTeamPermissionsForRole(
			await this.findTeamById(teamId, true),
			await this.findRoleById(roleId),
			teamPermissions
		);
	}

	// TODO;

	removeGroupAndFolderfromNextcloud(teamId: string) {
		this.adapter.removeGroupAndFolderfromNextcloud(teamId);
	}
}
