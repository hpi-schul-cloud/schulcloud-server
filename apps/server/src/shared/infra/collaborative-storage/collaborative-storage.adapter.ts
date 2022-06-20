import { RoleDto } from '@src/modules/collaborative-storage/services/dto/Role.dto';
import { TeamPermissionsDto } from '@src/modules/collaborative-storage/services/dto/team-permissions.dto';
import { TeamDto } from '@src/modules/collaborative-storage/services/dto/team.dto';
import { ITeamStorageStrategy } from '@shared/infra/collaborative-storage/strategy/base.interface.strategy';
import { Inject, Injectable } from '@nestjs/common';
import { CollaborativeStorageAdapterMapper } from '@shared/infra/collaborative-storage/mapper/collaborative-storage-adapter.mapper';

@Injectable()
export class CollaborativeStorageAdapter {
	strategy: ITeamStorageStrategy;

	constructor(
		@Inject('ITeamStorageStrategy') strategy: ITeamStorageStrategy,
		private mapper: CollaborativeStorageAdapterMapper
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
