import { Body, Controller, Delete, Get, Param, Post, Query } from '@nestjs/common';
import {
	ApiCreatedResponse,
	ApiForbiddenResponse,
	ApiFoundResponse,
	ApiOkResponse,
	ApiOperation,
	ApiResponse,
	ApiTags,
	ApiUnauthorizedResponse,
	ApiUnprocessableEntityResponse,
} from '@nestjs/swagger';
import { ValidationError } from '@shared/common';
import { PaginationParams } from '@shared/controller';
import { ExternalToolDO, IFindOptions, Page, ToolReference } from '@shared/domain';
import { LegacyLogger } from '@src/core/logger';
import { ICurrentUser } from '@src/modules/authentication';
import { Authenticate, CurrentUser } from '@src/modules/authentication/decorator/auth.decorator';
import { ExternalToolSearchQuery } from '../../common/interface';
import { ContextExternalToolContextParams } from '../../context-external-tool/controller/dto';
import { ExternalToolRequestMapper, ExternalToolResponseMapper } from '../mapper';
import { ExternalToolCreate, ExternalToolUc, ExternalToolUpdate, ToolReferenceUc } from '../uc';
import {
	ExternalToolCreateParams,
	ExternalToolResponse,
	ExternalToolSearchListResponse,
	ExternalToolSearchParams,
	ExternalToolUpdateParams,
	SortExternalToolParams,
	ToolIdParams,
	ToolReferenceListResponse,
	ToolReferenceResponse,
} from './dto';

@ApiTags('Tool')
@Authenticate('jwt')
@Controller('tools')
export class ToolController {
	constructor(
		private readonly externalToolUc: ExternalToolUc,
		private readonly externalToolDOMapper: ExternalToolRequestMapper,
		private readonly toolReferenceUc: ToolReferenceUc,
		private readonly logger: LegacyLogger
	) {}

	@Post()
	@ApiCreatedResponse({ description: 'The Tool has been successfully created.', type: ExternalToolResponse })
	@ApiForbiddenResponse()
	@ApiUnprocessableEntityResponse()
	@ApiUnauthorizedResponse()
	@ApiResponse({ status: 400, type: ValidationError, description: 'Request data has invalid format.' })
	async createExternalTool(
		@CurrentUser() currentUser: ICurrentUser,
		@Body() externalToolParams: ExternalToolCreateParams
	): Promise<ExternalToolResponse> {
		const externalToolDO: ExternalToolCreate = this.externalToolDOMapper.mapCreateRequest(externalToolParams);

		const created: ExternalToolDO = await this.externalToolUc.createExternalTool(currentUser.userId, externalToolDO);

		const mapped: ExternalToolResponse = ExternalToolResponseMapper.mapToExternalToolResponse(created);

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
		const query: ExternalToolSearchQuery =
			this.externalToolDOMapper.mapExternalToolFilterQueryToExternalToolSearchQuery(filterQuery);

		const tools: Page<ExternalToolDO> = await this.externalToolUc.findExternalTool(currentUser.userId, query, options);

		const dtoList: ExternalToolResponse[] = tools.data.map(
			(tool: ExternalToolDO): ExternalToolResponse => ExternalToolResponseMapper.mapToExternalToolResponse(tool)
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
		const mapped: ExternalToolResponse = ExternalToolResponseMapper.mapToExternalToolResponse(externalToolDO);

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
		@Body() externalToolParams: ExternalToolUpdateParams
	): Promise<ExternalToolResponse> {
		const externalTool: ExternalToolUpdate = this.externalToolDOMapper.mapUpdateRequest(externalToolParams);
		const updated: ExternalToolDO = await this.externalToolUc.updateExternalTool(
			currentUser.userId,
			params.toolId,
			externalTool
		);
		const mapped: ExternalToolResponse = ExternalToolResponseMapper.mapToExternalToolResponse(updated);
		this.logger.debug(`ExternalTool with id ${mapped.id} was updated by user with id ${currentUser.userId}`);

		return mapped;
	}

	@Delete(':toolId')
	@ApiForbiddenResponse({ description: 'User is not allowed to access this resource.' })
	@ApiUnauthorizedResponse({ description: 'User is not logged in.' })
	async deleteExternalTool(@CurrentUser() currentUser: ICurrentUser, @Param() params: ToolIdParams): Promise<void> {
		const promise: Promise<void> = this.externalToolUc.deleteExternalTool(currentUser.userId, params.toolId);
		this.logger.debug(`ExternalTool with id ${params.toolId} was deleted by user with id ${currentUser.userId}`);

		return promise;
	}

	@Get('/references/:contextType/:contextId')
	@ApiOperation({ summary: 'Get Tool References' })
	@ApiOkResponse({
		description: 'The Tool References has been successfully fetched.',
		type: ToolReferenceListResponse,
	})
	@ApiForbiddenResponse({ description: 'User is not allowed to access this resource.' })
	@ApiUnauthorizedResponse({ description: 'User is not logged in.' })
	async getToolReferences(
		@CurrentUser() currentUser: ICurrentUser,
		@Param() params: ContextExternalToolContextParams
	): Promise<ToolReferenceListResponse> {
		const toolReferences: ToolReference[] = await this.toolReferenceUc.getToolReferences(
			currentUser.userId,
			params.contextType,
			params.contextId
		);

		const toolReferenceResponses: ToolReferenceResponse[] =
			ExternalToolResponseMapper.mapToToolReferenceResponses(toolReferences);
		const toolReferenceListResponse = new ToolReferenceListResponse(toolReferenceResponses);

		return toolReferenceListResponse;
	}
}
