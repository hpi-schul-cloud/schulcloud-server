import { Injectable } from '@nestjs/common';
import { TeamStorageService } from '@src/modules/team-storage/services/team-storage.service';
import { TeamPermissionsMapper } from '@src/modules/team-storage/mapper/team-permissions.mapper';
import { TeamPermissionsBody } from '../controller/dto/team-permissions.body.params';
import { TeamRoleDto } from '../controller/dto/team-role.params';

@Injectable()
export class TeamStorageUc {
	constructor(private readonly service: TeamStorageService, private readonly permissionMapper: TeamPermissionsMapper) {}

	/**
	 * Sets a users permissions according to the dBildungscloud Configuration
	 *
	 */
	async updateUserPermissionsForRole(
		currentUserId: string,
		teamRole: TeamRoleDto,
		permissionsDto: TeamPermissionsBody
	): Promise<void> {
		return this.service.updateTeamPermissionsForRole(
			currentUserId,
			teamRole.team,
			teamRole.team,
			this.permissionMapper.mapBodyToDto(permissionsDto)
		);
	}
}
