import { Body, Controller, Get, Param, Post, Put, Query } from '@nestjs/common';
import { ICurrentUser } from '@shared/domain';
import { Authorization } from 'oauth-1.0a';
import { ExternalToolDO } from '@shared/domain/domainobject/external-tool/external-tool.do';
import {
	ApiCreatedResponse,
	ApiForbiddenResponse,
	ApiOkResponse,
	ApiTags,
	ApiUnauthorizedResponse,
	ApiUnprocessableEntityResponse,
} from '@nestjs/swagger';
import { Lti11LaunchQuery } from './dto/request/lti11-launch.query';
import { Lti11LaunchResponse } from './dto/lti11-launch.response';
import { Lti11ResponseMapper } from '../mapper/lti11-response.mapper';
import { ToolIdParams } from './dto/request/tool-id.params';
import { Lti11Uc } from '../uc/lti11.uc';
import { Authenticate, CurrentUser } from '../../authentication/decorator/auth.decorator';
import { ExternalToolRequestMapper } from '../mapper/external-tool-request.mapper';
import { ExternalToolResponseMapper } from '../mapper/external-tool-response.mapper';
import { ExternalToolResponse } from './dto/response/external-tool.response';
import { ExternalToolCreateParams } from './dto/request/external-tool-create.params';
import { ExternalToolUc } from '../uc/external-tool.uc';
import { ExternalToolUpdateParams } from './dto/request/external-tool-update.params';

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

	@Post()
	@ApiCreatedResponse({ description: 'The Tool has been successfully created.', type: ExternalToolResponse })
	@ApiForbiddenResponse()
	@ApiUnprocessableEntityResponse()
	@ApiUnauthorizedResponse()
	async createExternalTool(
		@Body() externalToolParams: ExternalToolCreateParams,
		@CurrentUser() currentUser: ICurrentUser
	): Promise<ExternalToolResponse> {
		const externalToolDO: ExternalToolDO =
			this.externalToolDOMapper.mapCreateRequestToExternalToolDO(externalToolParams);
		const created: ExternalToolDO = await this.externalToolUc.createExternalTool(externalToolDO, currentUser);
		const mapped: ExternalToolResponse = this.externalResponseMapper.mapToResponse(created);
		return mapped;
	}

	// TODO: POST instead of put to handle increasement of version number on server side?
	@Put('/:toolId')
	@ApiOkResponse({ description: 'The Tool has been successfully updated.', type: ExternalToolResponse })
	@ApiForbiddenResponse()
	@ApiUnauthorizedResponse()
	async updateExternalTool(
		@Param() params: ToolIdParams,
		@CurrentUser()
		currentUser: ICurrentUser,
		@Body() externalToolParams: ExternalToolUpdateParams
	): Promise<ExternalToolResponse> {
		const externalToolDO: ExternalToolDO =
			this.externalToolDOMapper.mapUpdateRequestToExternalToolDO(externalToolParams);
		const created: ExternalToolDO = await this.externalToolUc.updateExternalTool(
			params.toolId,
			externalToolDO,
			currentUser
		);
		const mapped: ExternalToolResponse = this.externalResponseMapper.mapToResponse(created);
		return mapped;
	}
}
