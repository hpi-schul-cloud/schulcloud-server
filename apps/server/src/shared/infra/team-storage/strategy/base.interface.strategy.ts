import { TeamRolePermissionsDto } from '../dto/team-role-permissions.dto';

export interface IFileStorageStrategy {
	baseURL: string;
	updateTeamPermissionsForRole(dto: TeamRolePermissionsDto): void;
}
