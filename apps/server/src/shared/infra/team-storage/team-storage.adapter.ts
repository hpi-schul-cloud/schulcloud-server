import { RoleDto } from '@src/modules/team-storage/services/dto/Role.dto';
import { TeamPermissionsDto } from '@src/modules/team-storage/services/dto/team-permissions.dto';
import { TeamDto } from '@src/modules/team-storage/services/dto/team.dto';
import { ITeamStorageStrategy } from '@shared/infra/team-storage/strategy/base.interface.strategy';
import { Inject, Injectable } from '@nestjs/common';
import { TeamStorageAdapterMapper } from '@shared/infra/team-storage/mapper/team-storage-adapter.mapper';

@Injectable()
export class TeamStorageAdapter {
	strategy: ITeamStorageStrategy;

	constructor(
		@Inject('ITeamStorageStrategy') strategy: ITeamStorageStrategy,
		private mapper: TeamStorageAdapterMapper
	) {
		this.strategy = strategy;
	}

	public setStrategy(strategy: ITeamStorageStrategy) {
		this.strategy = strategy;
	}

	updateTeamPermissionsForRole(team: TeamDto, role: RoleDto, permissions: TeamPermissionsDto) {
		this.strategy.updateTeamPermissionsForRole(this.mapper.mapDomainToAdapter(team, role, permissions));
	}
}
