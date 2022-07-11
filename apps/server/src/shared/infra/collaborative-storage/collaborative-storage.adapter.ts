import { RoleDto } from '@src/modules/collaborative-storage/services/dto/role.dto';
import { TeamPermissionsDto } from '@src/modules/collaborative-storage/services/dto/team-permissions.dto';
import { TeamDto } from '@src/modules/collaborative-storage/services/dto/team.dto';
import { ICollaborativeStorageStrategy } from '@shared/infra/collaborative-storage/strategy/base.interface.strategy';
import { Inject, Injectable } from '@nestjs/common';
import { CollaborativeStorageAdapterMapper } from '@shared/infra/collaborative-storage/mapper/collaborative-storage-adapter.mapper';
import { Logger } from '@src/core/logger';

/**
 * Provides an Adapter to an external collaborative storage.
 * It loads an appropritate strategy and applies that to the given data.
 */
@Injectable()
export class CollaborativeStorageAdapter {
	strategy: ICollaborativeStorageStrategy;

	constructor(
		@Inject('ICollaborativeStorageStrategy') strategy: ICollaborativeStorageStrategy,
		private mapper: CollaborativeStorageAdapterMapper,
		private logger: Logger
	) {
		this.logger.setContext(CollaborativeStorageAdapter.name);
		this.strategy = strategy;
	}

	/**
	 * Set the strategy that should be used by the adapter
	 * @param strategy The strategy
	 */
	public setStrategy(@Inject('ICollaborativeStorageStrategy') strategy: ICollaborativeStorageStrategy) {
		this.strategy = strategy;
	}

	/**
	 * Update the Permissions for a given Role in the given Team
	 * @param team The Team DTO
	 * @param role The Role DTO
	 * @param permissions The permissions to set
	 */
	updateTeamPermissionsForRole(team: TeamDto, role: RoleDto, permissions: TeamPermissionsDto) {
		this.strategy.updateTeamPermissionsForRole(this.mapper.mapDomainToAdapter(team, role, permissions));
	}

	public deleteTeam(teamId: string) {
		this.strategy.deleteGroupfolderAndRemoveGroup(teamId);
	}
}
