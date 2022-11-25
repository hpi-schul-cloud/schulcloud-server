import { Body, Controller, Delete, Get, Param, Post, Query } from '@nestjs/common';
import { ICurrentUser } from '@shared/domain';
import { Authorization } from 'oauth-1.0a';
import { ExternalToolDO } from '@shared/domain/domainobject/external-tool/external-tool.do';
import {
	ApiCreatedResponse,
	ApiForbiddenResponse,
	ApiTags,
	ApiUnauthorizedResponse,
	ApiUnprocessableEntityResponse,
} from '@nestjs/swagger';
import { Lti11LaunchQuery } from './dto/lti11-launch.query';
import { Lti11LaunchResponse } from './dto/lti11-launch.response';
import { Lti11ResponseMapper } from '../mapper/lti11-response.mapper';
import { Lti11LaunchParams } from './dto/lti11-launch.params';
import { Lti11Uc } from '../uc/lti11.uc';
import { Authenticate, CurrentUser } from '../../authentication/decorator/auth.decorator';
import { ExternalToolRequestMapper } from '../mapper/external-tool-request.mapper';
import { ExternalToolResponseMapper } from '../mapper/external-tool-response.mapper';
import { ExternalToolResponse } from './dto/response/external-tool.response';
import { ExternalToolParams } from './dto/request/external-tool-create.params';
import { ExternalToolUc } from '../uc/external-tool.uc';

@ApiTags('Tool')
@Authenticate('jwt')
@Controller('tools')
export class ToolController {
	constructor(
		private readonly lti11Uc: Lti11Uc,
		private readonly lti11ResponseMapper: Lti11ResponseMapper,
		private externalToolUc: ExternalToolUc,
		private readonly externalToolDOMapper: ExternalToolRequestMapper,
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

	@Post()
	@ApiCreatedResponse({ description: 'The Tool has been successfully created.', type: ExternalToolResponse })
	@ApiForbiddenResponse()
	@ApiUnprocessableEntityResponse()
	@ApiUnauthorizedResponse()
	async createExternalTool(
		@Body() externalToolParams: ExternalToolParams,
		@CurrentUser() currentUser: ICurrentUser
	): Promise<ExternalToolResponse> {
		const externalToolDO: ExternalToolDO = this.externalToolDOMapper.mapRequestToExternalToolDO(externalToolParams);
		const created: ExternalToolDO = await this.externalToolUc.createExternalTool(externalToolDO, currentUser);
		const mapped: ExternalToolResponse = this.externalResponseMapper.mapToResponse(created);
		return mapped;
	}

	@Delete(':toolId')
	async deleteExternalTool(
		@Param() params: Lti11LaunchParams,
		@CurrentUser() currentUser: ICurrentUser
	): Promise<void> {
		const promise: Promise<void> = this.externalToolUc.deleteExternalTool(params.toolId);
		return promise;
	}
}
