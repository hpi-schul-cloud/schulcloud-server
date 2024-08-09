import { CurrentUser, ICurrentUser, JwtAuthentication } from '@infra/auth-guard';
import { Body, Controller, Param, Patch } from '@nestjs/common';
import { ApiResponse, ApiTags } from '@nestjs/swagger';
import { LegacyLogger } from '@src/core/logger';
import { CollaborativeStorageUc } from '../uc/collaborative-storage.uc';
import { TeamPermissionsBody } from './dto/team-permissions.body.params';
import { TeamRoleDto } from './dto/team-role.params';

/**
 * Class for providing access to an external collaborative storage.
 *
 */
@ApiTags('Collaborative-Storage')
@JwtAuthentication()
@Controller('collaborative-storage')
export class CollaborativeStorageController {
	constructor(private readonly teamStorageUc: CollaborativeStorageUc, private logger: LegacyLogger) {
		this.logger.setContext(CollaborativeStorageController.name);
	}

	/**
	 * Updates the CRUD Permissions(+Share) for a specific Role in a Team
	 * @param currentUser The current User
	 * @param teamRole Encapsulates the Team and Role to be updated
	 * @param permissionsBody The new Permissions
	 */
	@Patch('team/:teamId/role/:roleId/permissions')
	@ApiResponse({ status: 200, description: 'Updates the permissions for a team in the external collaborative storage' })
	@ApiResponse({ status: 400, description: 'An error occurred while processing the request' })
	@ApiResponse({ status: 403, description: 'User does not have the correct permission' })
	@ApiResponse({ status: 404, description: 'Team or Role not found!' })
	updateTeamPermissionsForRole(
		@CurrentUser() currentUser: ICurrentUser,
		@Param() teamRole: TeamRoleDto,
		@Body() permissionsBody: TeamPermissionsBody
	): Promise<void> {
		return this.teamStorageUc.updateUserPermissionsForRole(currentUser.userId, teamRole, permissionsBody);
	}
}
