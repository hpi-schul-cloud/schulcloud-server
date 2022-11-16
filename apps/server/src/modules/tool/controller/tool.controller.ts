import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { Authenticate, CurrentUser } from '@src/modules/authentication/decorator/auth.decorator';
import { ICurrentUser } from '@shared/domain';
import { Authorization } from 'oauth-1.0a';
import { ExternalToolResponse } from '@src/modules/tool/controller/dto/response/external-tool.response';
import { ExternalToolUc } from '@src/modules/tool/uc/external-tool.uc';
import { ExternalToolParams } from '@src/modules/tool/controller/dto/request/external-tool-create.params';
import { ExternalToolDO } from '@shared/domain/domainobject/external-tool.do';
import { ApiTags } from '@nestjs/swagger';
import { ExternalToolMapper } from '@src/modules/tool/mapper/external-tool-do.mapper';
import { ExternalToolResponseMapper } from '@src/modules/tool/mapper/external-tool-response.mapper';
import { Lti11LaunchQuery } from './dto/lti11-launch.query';
import { Lti11LaunchResponse } from './dto/lti11-launch.response';
import { Lti11ResponseMapper } from '../mapper/lti11-response.mapper';
import { Lti11LaunchParams } from './dto/lti11-launch.params';
import { Lti11Uc } from '../uc/lti11.uc';

@ApiTags('Tool')
@Authenticate('jwt')
@Controller('tools')
export class ToolController {
	constructor(
		private readonly lti11Uc: Lti11Uc,
		private readonly lti11ResponseMapper: Lti11ResponseMapper,
		private externalToolUc: ExternalToolUc,
		private readonly externalToolDOMapper: ExternalToolMapper,
		private readonly externalResponseMapper: ExternalToolResponseMapper
	) {}

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
	async createExternalTool(
		@Body() externalToolParams: ExternalToolParams,
		@CurrentUser() currentUser: ICurrentUser
	): Promise<ExternalToolResponse> {
		const externalToolDO: ExternalToolDO = this.externalToolDOMapper.mapRequestToExternalToolDO(externalToolParams, 1);
		const created: ExternalToolDO = await this.externalToolUc.createExternalTool(externalToolDO, currentUser);
		const mapped: ExternalToolResponse = this.externalResponseMapper.mapToResponse(created);
		return mapped;
	}
}
