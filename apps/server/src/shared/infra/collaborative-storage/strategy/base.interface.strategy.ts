import { TeamRolePermissionsDto } from '../dto/team-role-permissions.dto';

/**
 * baseinterface for all CollaborativeStorage Strategies
 */
export interface ICollaborativeStorageStrategy {
	baseURL: string;

	/**
	 * Updates The Permissions for the given Role in the given Team
	 * @param dto The DTO to be processed
	 */
	updateTeamPermissionsForRole(dto: TeamRolePermissionsDto): void;
}
