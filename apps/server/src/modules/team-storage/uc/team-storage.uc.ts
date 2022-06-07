import { Injectable } from '@nestjs/common';
import { ICurrentUser, Team } from '@shared/domain';
import { TeamPermissionsBody, TeamRole } from '../controller/dto/team-permissions.body.params';

@Injectable
export class TeamStorageUc {
	/**
	 * Sets a users permissions according to the dBildungscloud Configuration
	 *
	 *
	 */
	async setUserPermissions(teamRole: TeamRoleDto, permissionsDto: TeamPermissions) {}
}
