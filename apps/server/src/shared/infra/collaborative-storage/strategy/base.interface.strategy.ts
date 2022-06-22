import { TeamRolePermissionsDto } from '../dto/team-role-permissions.dto';

export interface ICollaborativeStorageStrategy {
	baseURL: string;

	updateTeamPermissionsForRole(dto: TeamRolePermissionsDto): void;
}
