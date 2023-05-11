import { Body, Controller, Delete, Get, Param, Post, Query } from '@nestjs/common';
import {
	ApiCreatedResponse,
	ApiForbiddenResponse,
	ApiFoundResponse,
	ApiOkResponse,
	ApiResponse,
	ApiTags,
	ApiUnauthorizedResponse,
	ApiUnprocessableEntityResponse,
} from '@nestjs/swagger';
import { ValidationError } from '@shared/common';
import { PaginationParams } from '@shared/controller';
import { IFindOptions, RoleName, ExternalToolDO, Page } from '@shared/domain';
import { LegacyLogger } from '@src/core/logger';
import { ICurrentUser } from '@src/modules/authentication';
import { Authenticate, CurrentUser } from '@src/modules/authentication/decorator/auth.decorator';
import { Authorization } from 'oauth-1.0a';
import { CreateExternalTool, UpdateExternalTool } from '../uc/dto';
import { ExternalToolUc } from '../uc/external-tool.uc';
import { Lti11Uc } from '../uc/lti11.uc';
import {
	ExternalToolPostParams,
	ExternalToolResponse,
	ExternalToolSearchListResponse,
	ExternalToolSearchParams,
	Lti11LaunchQuery,
	Lti11LaunchResponse,
	SortExternalToolParams,
	ToolIdParams,
} from './dto';
import { ExternalToolRequestMapper, ExternalToolResponseMapper, Lti11ResponseMapper } from './mapper';

@ApiTags('Tool')
@Authenticate('jwt')
@Controller('tools')
export class ToolController {
	constructor(
		private readonly lti11Uc: Lti11Uc,
		private readonly lti11ResponseMapper: Lti11ResponseMapper,
		private readonly externalToolUc: ExternalToolUc,
		private readonly externalToolDOMapper: ExternalToolRequestMapper,
		private readonly externalResponseMapper: ExternalToolResponseMapper,
		private readonly logger: LegacyLogger
	) {}

	@Get('lti11/:toolId/launch')
	async getLti11LaunchParameters(
		@CurrentUser() currentUser: ICurrentUser,
		@Param() params: ToolIdParams,
		@Query() query: Lti11LaunchQuery
	): Promise<Lti11LaunchResponse> {
		const authorization: Authorization = await this.lti11Uc.getLaunchParameters(
			currentUser.userId,
			currentUser.roles[0] as RoleName,
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
	@ApiResponse({ status: 400, type: ValidationError, description: 'Request data has invalid format.' })
	async createExternalTool(
		@CurrentUser() currentUser: ICurrentUser,
		@Body() externalToolParams: ExternalToolPostParams
	): Promise<ExternalToolResponse> {
		const externalToolDO: CreateExternalTool = this.externalToolDOMapper.mapCreateRequest(externalToolParams);
		const created: ExternalToolDO = await this.externalToolUc.createExternalTool(currentUser.userId, externalToolDO);
		const mapped: ExternalToolResponse = this.externalResponseMapper.mapToResponse(created);
		this.logger.debug(`ExternalTool with id ${mapped.id} was created by user with id ${currentUser.userId}`);
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

	@Get(':toolId')
	async getExternalTool(
		@CurrentUser() currentUser: ICurrentUser,
		@Param() params: ToolIdParams
	): Promise<ExternalToolResponse> {
		const externalToolDO: ExternalToolDO = await this.externalToolUc.getExternalTool(currentUser.userId, params.toolId);
		const mapped: ExternalToolResponse = this.externalResponseMapper.mapToResponse(externalToolDO);
		return mapped;
	}

	@Post('/:toolId')
	@ApiOkResponse({ description: 'The Tool has been successfully updated.', type: ExternalToolResponse })
	@ApiForbiddenResponse()
	@ApiUnauthorizedResponse()
	@ApiResponse({ status: 400, type: ValidationError, description: 'Request data has invalid format.' })
	async updateExternalTool(
		@CurrentUser() currentUser: ICurrentUser,
		@Param() params: ToolIdParams,
		@Body() externalToolParams: ExternalToolPostParams
	): Promise<ExternalToolResponse> {
		const externalTool: UpdateExternalTool = this.externalToolDOMapper.mapUpdateRequest(externalToolParams);
		const updated: ExternalToolDO = await this.externalToolUc.updateExternalTool(
			currentUser.userId,
			params.toolId,
			externalTool
		);
		const mapped: ExternalToolResponse = this.externalResponseMapper.mapToResponse(updated);
		this.logger.debug(`ExternalTool with id ${mapped.id} was updated by user with id ${currentUser.userId}`);
		return mapped;
	}

	@Delete(':toolId')
	async deleteExternalTool(@CurrentUser() currentUser: ICurrentUser, @Param() params: ToolIdParams): Promise<void> {
		const promise: Promise<void> = this.externalToolUc.deleteExternalTool(currentUser.userId, params.toolId);
		this.logger.debug(`ExternalTool with id ${params.toolId} was deleted by user with id ${currentUser.userId}`);
		return promise;
	}
}
