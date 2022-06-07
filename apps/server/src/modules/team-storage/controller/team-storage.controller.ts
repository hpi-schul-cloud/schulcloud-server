import { ApiResponse, ApiTags } from '@nestjs/swagger';
import { Controller, Get, Param, Patch, Put, Query, Res } from '@nestjs/common';
import { Authenticate, CurrentUser } from '@src/modules/authentication/decorator/auth.decorator';
import { ICurrentUser } from '@shared/domain';

@ApiTags('team-storage')
@Authenticate('jwt')
@Controller('team-storage')
export class TeamStorageController {
	@Patch('permissions')
	@ApiResponse({ status: 200, description: 'Updates the permissions for the current user in the external teamstorage' })
	updateTeamPermissions(@CurrentUser() _currentUser: ICurrentUser): Promise<null> {
		return null;
	}
}
