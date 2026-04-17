import { ErrorResponse } from '@core/error/dto';
import { CurrentUser, ICurrentUser, JwtAuthentication } from '@infra/auth-guard';
import {
	Controller,
	ForbiddenException,
	HttpStatus,
	NotFoundException,
	Param,
	Post,
	UnauthorizedException,
} from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { ApiValidationError } from '@shared/common/error';
import { TeamUrlParams } from './dto/request/team.url.params';
import { TeamCreateRoomResponse } from './dto/response/team-export-room.response';
import { TeamUc } from './team.uc';

@ApiTags('Team')
@JwtAuthentication()
@Controller('teams')
export class TeamController {
	constructor(private readonly teamExportUc: TeamUc) {}

	@Post(':teamId/create-room')
	@ApiOperation({ summary: 'Create an empty room with the members of the team.' })
	@ApiResponse({
		status: HttpStatus.CREATED,
		description: 'Returns the id of the new room.',
		type: TeamCreateRoomResponse,
	})
	@ApiResponse({ status: HttpStatus.BAD_REQUEST, type: ApiValidationError })
	@ApiResponse({ status: HttpStatus.UNAUTHORIZED, type: UnauthorizedException })
	@ApiResponse({ status: HttpStatus.FORBIDDEN, type: ForbiddenException })
	@ApiResponse({ status: HttpStatus.NOT_FOUND, type: NotFoundException })
	@ApiResponse({ status: '5XX', type: ErrorResponse })
	public async createRoomWithMembers(
		@CurrentUser() currentUser: ICurrentUser,
		@Param() urlParams: TeamUrlParams
	): Promise<TeamCreateRoomResponse> {
		const result = await this.teamExportUc.createRoomWithTeamMembers(currentUser.userId, urlParams.teamId);

		const response = new TeamCreateRoomResponse(result.roomId);

		return response;
	}
}
