import { RoleDto } from '@src/modules/collaborative-storage/services/dto/role.dto';
import { TeamPermissionsDto } from '@src/modules/collaborative-storage/services/dto/team-permissions.dto';
import { TeamDto } from '@src/modules/collaborative-storage/services/dto/team.dto';
import { ICollaborativeStorageStrategy } from '@shared/infra/collaborative-storage/strategy/base.interface.strategy';
import { Inject, Injectable } from '@nestjs/common';
import { CollaborativeStorageAdapterMapper } from '@shared/infra/collaborative-storage/mapper/collaborative-storage-adapter.mapper';

@Injectable()
export class CollaborativeStorageAdapter {
	strategy: ICollaborativeStorageStrategy;

	constructor(
		@Inject('ICollaborativeStorageStrategy') strategy: ICollaborativeStorageStrategy,
		private mapper: CollaborativeStorageAdapterMapper
	) {
		this.strategy = strategy;
	}

	public setStrategy(@Inject('ICollaborativeStorageStrategy') strategy: ICollaborativeStorageStrategy) {
		this.strategy = strategy;
	}

	updateTeamPermissionsForRole(team: TeamDto, role: RoleDto, permissions: TeamPermissionsDto) {
		this.strategy.updateTeamPermissionsForRole(this.mapper.mapDomainToAdapter(team, role, permissions));
	}
}
