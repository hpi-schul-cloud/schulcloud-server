import { Controller, Get, Param, Query } from '@nestjs/common';
import { Authenticate, CurrentUser } from '@src/modules/authentication/decorator/auth.decorator';
import { ICurrentUser } from '@shared/domain';
import { Authorization } from 'oauth-1.0a';
import { Lti11LaunchQuery } from './dto/lti11-launch.query';
import { Lti11LaunchResponse } from './dto/lti11-launch.response';
import { Lti11ResponseMapper } from '../mapper/lti11-response.mapper';
import { Lti11LaunchParams } from './dto/lti11-launch.params';
import { Lti11Uc } from '../uc/lti11.uc';

@Controller('tools')
export class ToolController {
	constructor(private readonly lti11Uc: Lti11Uc, private readonly lti11ResponseMapper: Lti11ResponseMapper) {}

	@Get('lti11/:toolId/launch')
	@Authenticate('jwt')
	async getLti11LaunchParameters(
		@CurrentUser() currentUser: ICurrentUser,
		@Param() params: Lti11LaunchParams,
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
