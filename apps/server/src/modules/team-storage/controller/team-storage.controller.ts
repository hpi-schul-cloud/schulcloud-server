import { ApiResponse, ApiTags } from '@nestjs/swagger';
import { Body, Controller, Patch, Query } from '@nestjs/common';
import { Authenticate, CurrentUser } from '@src/modules/authentication/decorator/auth.decorator';
import { ICurrentUser } from '@shared/domain';
import { TeamStorageUc } from '../uc/team-storage.uc';
import { TeamPermissions } from './dto/team-permissions.body.params';
import { TeamRoleDto } from './dto/team-role.params';

@ApiTags('team-storage')
@Authenticate('jwt')
@Controller('team-storage')
export class TeamStorageController {
	constructor(private readonly teamStorageUc: TeamStorageUc) {}

	@Patch('permissions')
	@ApiResponse({ status: 200, description: 'Updates the permissions for a team in the external teamstorage' })
	@ApiResponse({ status: 400, description: 'An error occured while processing the request' })
	@ApiResponse({ status: 403, description: 'User does not have the correct permission' })
	updateTeamPermissions(
		@CurrentUser() currentUser: ICurrentUser,
		@Query() teamRole: TeamRoleDto,
		@Body() permissionsBody: TeamPermissions
	): Promise<void> {
		return this.teamStorageUc.setUserPermissions(teamRole, permissionsBody);
	}
}
