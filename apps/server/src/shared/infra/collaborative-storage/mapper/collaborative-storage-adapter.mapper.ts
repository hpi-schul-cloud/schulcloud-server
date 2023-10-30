import { Injectable } from '@nestjs/common';
import { TeamPermissionsDto } from '@src/modules/collaborative-storage/services/dto/team-permissions.dto';
import { TeamDto } from '@src/modules/collaborative-storage/services/dto/team.dto';
import { RoleDto } from '@src/modules/role/service/dto/role.dto';
import { TeamRolePermissionsDto } from '../dto/team-role-permissions.dto';

@Injectable()
export class CollaborativeStorageAdapterMapper {
	/**
	 * Maps the Domain DTOs to an appropriate adapter DTO
	 * @param team The Team DTO
	 * @param role The Role DTO
	 * @param permissions The Permissions DTO
	 * @return The mapped adapter DTO
	 */
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
