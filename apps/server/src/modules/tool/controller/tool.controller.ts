import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { Authenticate, CurrentUser } from '@src/modules/authentication/decorator/auth.decorator';
import { ICurrentUser } from '@shared/domain';
import { Authorization } from 'oauth-1.0a';
import { ExternalToolResponse } from '@src/modules/tool/controller/dto/response/external-tool.response';
import { ExternalToolUc } from '@src/modules/tool/uc/external-tool.uc';
import { ExternalToolParams } from '@src/modules/tool/controller/dto/request/external-tool-create.params';
import { ExternalToolDO } from '@shared/domain/domainobject/external-tool.do';
import { Lti11LaunchQuery } from './dto/lti11-launch.query';
import { Lti11LaunchResponse } from './dto/lti11-launch.response';
import { Lti11ResponseMapper } from '../mapper/lti11-response.mapper';
import { Lti11LaunchParams } from './dto/lti11-launch.params';
import { Lti11Uc } from '../uc/lti11.uc';

@Controller('tools')
export class ToolController {
	constructor(
		private readonly lti11Uc: Lti11Uc,
		private readonly lti11ResponseMapper: Lti11ResponseMapper,
		private externalToolUc: ExternalToolUc
	) {}

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

	@Post('externalTool')
	async createExternalTool(
		@Body() externalToolParams: ExternalToolParams,
		@CurrentUser() currentUser: ICurrentUser
	): Promise<ExternalToolResponse> {
		switch (externalToolParams.config.type) {
			case 'basic': {
				const externalTool: ExternalToolDO = await this.externalToolUc.createExternalTool(
					externalToolParams,
					currentUser
				);
				const mapped: ExternalToolResponse = ExternalToolDOMapper.mapExternalToolToResponse(externalTool);
				return mapped;
				break;
			}
			case 'lti11': {
				// statements;
				break;
			}
			case 'oauth': {
				// statements;
				break;
			}
			default: {
				// statements;
				break;
			}
		}
	}
}
