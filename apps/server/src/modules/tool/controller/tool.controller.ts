import { Body, Controller, Delete, Get, Param, Post, Query } from '@nestjs/common';
import { ICurrentUser, IFindOptions } from '@shared/domain';
import { Authorization } from 'oauth-1.0a';
import {
	ApiCreatedResponse,
	ApiForbiddenResponse,
	ApiFoundResponse,
	ApiTags,
	ApiUnauthorizedResponse,
	ApiUnprocessableEntityResponse,
} from '@nestjs/swagger';
import { PaginationParams } from '@shared/controller';
import { Page } from '@shared/domain/interface/page';
import { ExternalToolDO } from '@shared/domain/domainobject/external-tool';
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
import { ExternalToolSearchListResponse } from './dto/response/external-tool-search-list.response';
import { ExternalToolSearchParams } from './dto/request/external-tool-search.params';
import { SortExternalToolParams } from './dto/request/external-tool-sort.params';

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
		const created: ExternalToolDO = await this.externalToolUc.createExternalTool(externalToolDO, currentUser.userId);
		const mapped: ExternalToolResponse = this.externalResponseMapper.mapToResponse(created);
		return mapped;
	}

	@Get()
	@ApiFoundResponse({ description: 'Tools has been found.', type: ExternalToolSearchListResponse })
	@ApiUnauthorizedResponse()
	@ApiForbiddenResponse()
	async findExternalTool(
		@CurrentUser() currentUser: ICurrentUser,
		@Query() filterQuery: ExternalToolSearchParams,
		@Query() pagination: PaginationParams,
		@Query() sortingQuery: SortExternalToolParams
	): Promise<ExternalToolSearchListResponse> {
		const options: IFindOptions<ExternalToolDO> = { pagination };
		options.order = this.externalToolDOMapper.mapSortingQueryToDomain(sortingQuery);
		const query: Partial<ExternalToolDO> = this.externalToolDOMapper.mapExternalToolFilterQueryToDO(filterQuery);

		const tools: Page<ExternalToolDO> = await this.externalToolUc.findExternalTool(currentUser.userId, query, options);

		const dtoList: ExternalToolResponse[] = tools.data.map(
			(tool: ExternalToolDO): ExternalToolResponse => this.externalResponseMapper.mapToResponse(tool)
		);
		const response: ExternalToolSearchListResponse = new ExternalToolSearchListResponse(
			dtoList,
			tools.total,
			pagination.skip,
			pagination.limit
		);
		return response;
	}

	@Delete(':toolId')
	async deleteExternalTool(
		@Param() params: Lti11LaunchParams,
		@CurrentUser() currentUser: ICurrentUser
	): Promise<void> {
		const promise: Promise<void> = this.externalToolUc.deleteExternalTool(currentUser.userId, params.toolId);
		return promise;
	}
}
