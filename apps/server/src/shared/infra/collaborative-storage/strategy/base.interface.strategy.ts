import { TeamDto } from '@src/modules/collaborative-storage/services/dto/team.dto';
import { TeamRolePermissionsDto } from '../dto/team-role-permissions.dto';

/**
 * base interface for all CollaborativeStorage Strategies
 */
export interface ICollaborativeStorageStrategy {
	/**
	 * Updates The Permissions for the given Role in the given Team
	 * @param dto The DTO to be processed
	 */
	updateTeamPermissionsForRole(dto: TeamRolePermissionsDto): void;

	deleteTeam(teamId: string): Promise<void>;

	createTeam(team: TeamDto): Promise<void>;

	updateTeam(team: TeamDto): Promise<void>;
}
