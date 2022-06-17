import { TeamRolePermissionsDto } from '../dto/team-role-permissions.dto';

export interface ITeamStorageStrategy {
	baseURL: string;
	updateTeamPermissionsForRole(dto: TeamRolePermissionsDto): void;
}
