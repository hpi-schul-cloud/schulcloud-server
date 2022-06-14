import { Injectable } from '@nestjs/common';
import { TeamPermissionsBody } from '../controller/dto/team-permissions.body.params';
import { TeamRoleDto } from '../controller/dto/team-role.params';
import {TeamStorageService} from "@src/modules/team-storage/services/team-storage.service";
import {ICurrentUser} from "@shared/domain";
import {TeamPermissionsMapper} from "@src/modules/team-storage/mapper/team-permissions.mapper";

@Injectable()
export class TeamStorageUc {

	constructor(private readonly service: TeamStorageService, private readonly permissionMapper: TeamPermissionsMapper ){};

	/**
	 * Sets a users permissions according to the dBildungscloud Configuration
	 *
	 */
	async updateUserPermissionsForRole(currentUser: ICurrentUser, teamRole: TeamRoleDto, permissionsDto: TeamPermissionsBody): Promise<void> {
		return this.service.updateTeamPermissionsForRole(currentUser,teamRole.team,teamRole.team, this.permissionMapper.mapBodyToDto(permissionsDto))
	}
}
