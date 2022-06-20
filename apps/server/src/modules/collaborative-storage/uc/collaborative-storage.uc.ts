import { Injectable } from '@nestjs/common';
import { CollaborativeStorageService } from '@src/modules/collaborative-storage/services/collaborative-storage.service';
import { TeamPermissionsMapper } from '@src/modules/collaborative-storage/mapper/team-permissions.mapper';
import { TeamPermissionsBody } from '../controller/dto/team-permissions.body.params';
import { TeamRoleDto } from '../controller/dto/team-role.params';

@Injectable()
export class CollaborativeStorageUc {
	constructor(
		private readonly service: CollaborativeStorageService,
		private readonly permissionMapper: TeamPermissionsMapper
	) {}

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
			teamRole.teamId,
			teamRole.roleId,
			this.permissionMapper.mapBodyToDto(permissionsDto)
		);
	}
}
