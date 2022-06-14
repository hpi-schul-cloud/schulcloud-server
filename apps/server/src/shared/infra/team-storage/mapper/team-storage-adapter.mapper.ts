import { RoleDto } from '@src/modules/team-storage/services/dto/Role.dto';
import { TeamPermissionsDto } from '@src/modules/team-storage/services/dto/team-permissions.dto';
import { TeamDto } from '@src/modules/team-storage/services/dto/team.dto';
import { TeamRolePermissionsDto } from '../dto/team-role-permissions.dto';
import {Injectable} from "@nestjs/common";

@Injectable()
export class TeamStorageAdapterMapper {
	public mapDomainToAdapter(team: TeamDto, role: RoleDto, permissions: TeamPermissionsDto): TeamRolePermissionsDto {
		return new TeamRolePermissionsDto({
			teamId: team.id,
			teamName: team.name,
			roleName: role.name,
			permissions: [
				!!permissions.read,
				!!permissions.write,
				!!permissions.create,
				!!permissions.delete,
				!!permissions.share,
			],
		});
	}
}
