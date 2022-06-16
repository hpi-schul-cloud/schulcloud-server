import { ForbiddenException, Injectable } from '@nestjs/common';
import { EntityId, ICurrentUser, RoleName } from '@shared/domain';
import { RoleRepo, TeamsRepo } from '@shared/repo';
import { RoleMapper } from '../mapper/role.mapper';
import { TeamMapper } from '../mapper/team.mapper';
import { RoleDto } from './dto/role.dto';
import { TeamPermissionsDto } from './dto/team-permissions.dto';
import { TeamDto, TeamUserDto } from './dto/team.dto';
import {TeamStorageAdapter} from "@shared/infra/team-storage";
import {NextcloudStrategy} from "@shared/infra/team-storage/strategy/nextcloud.strategy";
import {HttpService} from "@nestjs/axios";

@Injectable()
export class TeamStorageService {
	constructor(
		private adapter: TeamStorageAdapter,
		private roleRepo: RoleRepo,
		private teamsMapper: TeamMapper,
		private roleMapper: RoleMapper,
		private teamsRepo: TeamsRepo,
	) {
		this.adapter.setStrategy(new NextcloudStrategy(new HttpService()));
	}

	async findTeamById(teamId: EntityId, populate = false): Promise<TeamDto> {
		return this.teamsMapper.mapEntityToDto(await this.teamsRepo.findById(teamId, populate));
	}

	async findRoleById(roleId: EntityId): Promise<RoleDto> {
		return this.roleMapper.mapEntityToDto(await this.roleRepo.findById(roleId));
	}

	async isUserAuthorized(currentUserId: string, teamId: string): Promise<boolean> {
		const team: TeamDto = await this.findTeamById(teamId, true);
		return new Promise<boolean>((resolve) => {
			team.userIds.forEach((teamIdDto: TeamUserDto) => {
				if (currentUserId === teamIdDto.userId) {
					resolve(
						this.findRoleById(teamIdDto.role).then((roleDto) => {
							return roleDto.name === RoleName.TEAMADMINISTRATOR || roleDto.name === RoleName.TEAMOWNER;
						})
					);
				}
			});
		});
	}

	async updateTeamPermissionsForRole(
		currentUserId: string,
		teamId: string,
		roleId: string,
		teamPermissions: TeamPermissionsDto
	):Promise<void> {
		if (!(await this.isUserAuthorized(currentUserId, teamId))) {
			throw new ForbiddenException({ description: 'User is not Teamadmin or Teamowner' });
		}
		this.adapter.updateTeamPermissionsForRole(await this.findTeamById(teamId, true), await this.findRoleById(roleId), teamPermissions);
	}
}
