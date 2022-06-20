import { RoleDto } from '@src/modules/collaborative-storage/services/dto/Role.dto';
import { TeamPermissionsDto } from '@src/modules/collaborative-storage/services/dto/team-permissions.dto';
import { TeamDto } from '@src/modules/collaborative-storage/services/dto/team.dto';
import { Injectable } from '@nestjs/common';
import { TeamRolePermissionsDto } from '../dto/team-role-permissions.dto';

@Injectable()
export class CollaborativeStorageAdapterMapper {
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
