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
import { ExternalToolDO, IFindOptions, Page } from '@shared/domain';
import { LegacyLogger } from '@src/core/logger';
import { ICurrentUser } from '@src/modules/authentication';
import { Authenticate, CurrentUser } from '@src/modules/authentication/decorator/auth.decorator';
import { ExternalToolCreate, ExternalToolUc, ExternalToolUpdate } from '../uc';
import {
	ContextExternalToolContextParams,
	ExternalToolCreateParams,
	ExternalToolResponse,
	ExternalToolSearchListResponse,
	ExternalToolSearchParams,
	ExternalToolUpdateParams,
	SortExternalToolParams,
	ToolConfigurationStatusResponse,
	ToolIdParams,
	ToolReferenceResponse,
} from './dto';
import { ExternalToolRequestMapper, ExternalToolResponseMapper } from './mapper';
import { ToolReferenceListResponse } from './dto/response/tool-reference-list.response';

@ApiTags('Tool')
@Authenticate('jwt')
@Controller('tools')
export class ToolController {
	constructor(
		private readonly externalToolUc: ExternalToolUc,
		private readonly externalToolDOMapper: ExternalToolRequestMapper,
		private readonly externalResponseMapper: ExternalToolResponseMapper,
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
		@Body() externalToolParams: ExternalToolUpdateParams
	): Promise<ExternalToolResponse> {
		const externalTool: ExternalToolUpdate = this.externalToolDOMapper.mapUpdateRequest(externalToolParams);
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

	@Get('/reference/:contextType/:contextId')
	async getToolReferences(
		// eslint-disable-next-line @typescript-eslint/no-unused-vars
		@CurrentUser() currentUser: ICurrentUser,
		// eslint-disable-next-line @typescript-eslint/no-unused-vars
		@Param() params: ContextExternalToolContextParams
	): Promise<ToolReferenceListResponse> {
		const list: ToolReferenceListResponse = new ToolReferenceListResponse([
			new ToolReferenceResponse({
				logoUrl: 'https://www.google.com/images/branding/googlelogo/1x/googlelogo_color_272x92dp.png',
				displayName: 'Google',
				contextToolId: '644a4839d0a8301e6cf25d8f',
				status: ToolConfigurationStatusResponse.LATEST,
				openInNewTab: true,
			}),
			new ToolReferenceResponse({
				displayName: 'Google 2',
				contextToolId: '644a4839d0a8301e6cf25d8f',
				status: ToolConfigurationStatusResponse.OUTDATED,
				openInNewTab: false,
			}),
		]);
		return Promise.resolve(list);
	}
}
