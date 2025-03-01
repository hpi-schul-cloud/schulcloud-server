import { TeamPermissionsDto } from '@modules/collaborative-storage/services/dto/team-permissions.dto';
import { TeamDto } from '@modules/collaborative-storage/services/dto/team.dto';
import { RoleDto } from '@modules/role/service/dto/role.dto';
import { Inject, Injectable } from '@nestjs/common';
import { LegacyLogger } from '@core/logger';
import { CollaborativeStorageAdapterMapper } from './mapper/collaborative-storage-adapter.mapper';
import { CollaborativeStorageStrategy } from './strategy/base.interface.strategy';

/**
 * Provides an Adapter to an external collaborative storage.
 * It loads an appropriate strategy and applies that to the given data.
 */
@Injectable()
export class CollaborativeStorageAdapter {
	strategy: CollaborativeStorageStrategy;

	constructor(
		@Inject('CollaborativeStorageStrategy') strategy: CollaborativeStorageStrategy,
		private mapper: CollaborativeStorageAdapterMapper,
		private logger: LegacyLogger
	) {
		this.logger.setContext(CollaborativeStorageAdapter.name);
		this.strategy = strategy;
	}

	/**
	 * Set the strategy that should be used by the adapter
	 * @param strategy The strategy
	 */
	setStrategy(strategy: CollaborativeStorageStrategy) {
		this.strategy = strategy;
	}

	/**
	 * Update the Permissions for a given Role in the given Team
	 * @param team The Team DTO
	 * @param role The Role DTO
	 * @param permissions The permissions to set
	 */
	updateTeamPermissionsForRole(team: TeamDto, role: RoleDto, permissions: TeamPermissionsDto): Promise<void> {
		return this.strategy.updateTeamPermissionsForRole(this.mapper.mapDomainToAdapter(team, role, permissions));
	}

	/**
	 * Deletes a team in the collaborative storage
	 *
	 * @param teamId The team id
	 */
	deleteTeam(teamId: string): Promise<void> {
		return this.strategy.deleteTeam(teamId);
	}

	/**
	 * Creates a team in the collaborative storage
	 *
	 * @param team The team DTO
	 */
	createTeam(team: TeamDto): Promise<void> {
		return this.strategy.createTeam(team);
	}

	/**
	 * Updates a team in the collaborative storage
	 *
	 * @param team The team DTO
	 */
	updateTeam(team: TeamDto): Promise<void> {
		return this.strategy.updateTeam(team);
	}
}
