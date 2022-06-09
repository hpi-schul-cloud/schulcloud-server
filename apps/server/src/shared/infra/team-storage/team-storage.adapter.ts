import { RoleDto } from '@src/modules/team-storage/services/dto/Role.dto';
import { TeamPermissionsDto } from '@src/modules/team-storage/services/dto/team-permissions.dto';
import { TeamDto } from '@src/modules/team-storage/services/dto/team.dto';
import { TeamRolePermissionsDto } from './dto/team-role-permissions.dto';

export class TeamStorageAdapter {
	updateTeamPermissionsForRole(team: TeamDto, role: RoleDto, permissions: TeamPermissionsDto) {
        TeamRolePermissionsDto
    }
}
