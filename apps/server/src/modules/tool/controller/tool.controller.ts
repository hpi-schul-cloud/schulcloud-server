import { Controller, Get, Param, Query } from '@nestjs/common';
import { Authenticate, CurrentUser } from '@src/modules/authentication/decorator/auth.decorator';
import { ICurrentUser } from '@shared/domain';
import { Authorization } from 'oauth-1.0a';
import { ToolIdParams } from '@src/modules/tool/controller/dto/request/tool-id.params';
import { ApiTags } from '@nestjs/swagger';
import { Lti11ResponseMapper } from '../mapper/lti11-response.mapper';
import { Lti11Uc } from '../uc/lti11.uc';
import { Lti11LaunchQuery } from './dto/request/lti11-launch.query';
import { Lti11LaunchResponse } from './dto/response/lti11-launch.response';

@ApiTags('Tools')
@Controller('tools')
@Authenticate('jwt')
export class ToolController {
	constructor(private readonly lti11Uc: Lti11Uc, private readonly lti11ResponseMapper: Lti11ResponseMapper) {}

	@Get('lti11/:toolId/launch')
	async getLti11LaunchParameters(
		@CurrentUser() currentUser: ICurrentUser,
		@Param() params: ToolIdParams,
		@Query() query: Lti11LaunchQuery
	): Promise<Lti11LaunchResponse> {
		const authorization: Authorization = await this.lti11Uc.getLaunchParameters(
			currentUser,
			params.toolId,
			query.courseId
		);
		const mapped: Lti11LaunchResponse = this.lti11ResponseMapper.mapAuthorizationToResponse(authorization);
		return mapped;
	}
}
