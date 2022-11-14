import { Body, Controller, Get, NotImplementedException, Param, Post, Query } from '@nestjs/common';
import { Authenticate, CurrentUser } from '@src/modules/authentication/decorator/auth.decorator';
import { ICurrentUser } from '@shared/domain';
import { Authorization } from 'oauth-1.0a';
import { ExternalToolResponse } from '@src/modules/tool/controller/dto/response/external-tool.response';
import { ExternalToolParams } from '@src/modules/tool/controller/dto/request/external-tool-create.params';
import { ApiTags } from '@nestjs/swagger';
import { Lti11LaunchQuery } from './dto/lti11-launch.query';
import { Lti11LaunchResponse } from './dto/lti11-launch.response';
import { Lti11ResponseMapper } from '../mapper/lti11-response.mapper';
import { Lti11LaunchParams } from './dto/lti11-launch.params';
import { Lti11Uc } from '../uc/lti11.uc';

@ApiTags('Tool')
@Authenticate('jwt')
@Controller('tools')
export class ToolController {
	constructor(private readonly lti11Uc: Lti11Uc, private readonly lti11ResponseMapper: Lti11ResponseMapper) {}

	@Get('lti11/:toolId/launch')
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

	@Post('tools')
	createExternalTool(
		@Body() externalToolParams: ExternalToolParams,
		@CurrentUser() currentUser: ICurrentUser
	): Promise<ExternalToolResponse> {
		throw new NotImplementedException();
	}
}
