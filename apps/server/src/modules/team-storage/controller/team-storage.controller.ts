import { ApiResponse, ApiTags } from '@nestjs/swagger';
import { Body, Controller, Param, Patch } from '@nestjs/common';
import { Authenticate, CurrentUser } from '@src/modules/authentication/decorator/auth.decorator';
import { ICurrentUser } from '@shared/domain';
import { TeamStorageUc } from '../uc/team-storage.uc';
import { TeamPermissionsBody } from './dto/team-permissions.body.params';
import { TeamRoleDto } from './dto/team-role.params';

@ApiTags('team-storage')
@Authenticate('jwt')
@Controller('team-storage')
export class TeamStorageController {
	constructor(private readonly teamStorageUc: TeamStorageUc) {}

	@Patch(':team/role/:role/permissions')
	@ApiResponse({ status: 200, description: 'Updates the permissions for a team in the external teamstorage' })
	@ApiResponse({ status: 400, description: 'An error occured while processing the request' })
	@ApiResponse({ status: 403, description: 'User does not have the correct permission' })
	@ApiResponse({ status: 404, description: 'Team or Role not found!' })
	updateTeamPermissionsForRole(
		@CurrentUser() currentUser: ICurrentUser,
		@Param() teamRole: TeamRoleDto,
		@Body() permissionsBody: TeamPermissionsBody
	): Promise<void> {
		return this.teamStorageUc.updateUserPermissionsForRole(currentUser, teamRole, permissionsBody);
	}
}
