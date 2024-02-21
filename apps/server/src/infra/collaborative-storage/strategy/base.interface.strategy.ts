import { TeamDto } from '@modules/collaborative-storage/services/dto/team.dto';
import { TeamRolePermissionsDto } from '../dto/team-role-permissions.dto';

/**
 * base interface for all CollaborativeStorage Strategies
 */
export interface CollaborativeStorageStrategy {
	/**
	 * Updates The Permissions for the given Role in the given Team
	 * @param dto The DTO to be processed
	 */
	updateTeamPermissionsForRole(dto: TeamRolePermissionsDto): Promise<void>;

	deleteTeam(teamId: string): Promise<void>;

	createTeam(team: TeamDto): Promise<void>;

	updateTeam(team: TeamDto): Promise<void>;
}
