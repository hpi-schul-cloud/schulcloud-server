import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Post, Query, Res } from '@nestjs/common';
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
import { IFindOptions, Page } from '@shared/domain';
import { LegacyLogger } from '@src/core/logger';
import { ICurrentUser } from '@src/modules/authentication';
import { Authenticate, CurrentUser } from '@src/modules/authentication/decorator/auth.decorator';
import { Response } from 'express';
import { ExternalToolSearchQuery } from '../../common/interface';
import { ContextExternalToolContextParams } from '../../context-external-tool/controller/dto';
import { ExternalTool, ToolReference } from '../domain';
import { ExternalToolLogo } from '../domain/external-tool-logo';
import { ExternalToolRequestMapper, ExternalToolResponseMapper } from '../mapper';
import { ExternalToolCreate, ExternalToolUc, ExternalToolUpdate, ToolReferenceUc } from '../uc';
import {
	ExternalToolCreateParams,
	ExternalToolResponse,
	ExternalToolSearchListResponse,
	ExternalToolSearchParams,
	ExternalToolUpdateParams,
	SortExternalToolParams,
	ExternalToolIdParams,
	ToolReferenceListResponse,
	ToolReferenceResponse,
} from './dto';

@ApiTags('Tool')
@Authenticate('jwt')
@Controller('tools/external-tools')
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
	@ApiOperation({ summary: 'Creates an ExternalTool' })
	async createExternalTool(
		@CurrentUser() currentUser: ICurrentUser,
		@Body() externalToolParams: ExternalToolCreateParams
	): Promise<ExternalToolResponse> {
		const externalTool: ExternalToolCreate = this.externalToolDOMapper.mapCreateRequest(externalToolParams);

		const created: ExternalTool = await this.externalToolUc.createExternalTool(currentUser.userId, externalTool);

		const mapped: ExternalToolResponse = ExternalToolResponseMapper.mapToExternalToolResponse(created);

		this.logger.debug(`ExternalTool with id ${mapped.id} was created by user with id ${currentUser.userId}`);

		return mapped;
	}

	@Get()
	@ApiFoundResponse({ description: 'Tools has been found.', type: ExternalToolSearchListResponse })
	@ApiUnauthorizedResponse()
	@ApiForbiddenResponse()
	@ApiOperation({ summary: 'Returns a list of ExternalTools' })
	async findExternalTool(
		@CurrentUser() currentUser: ICurrentUser,
		@Query() filterQuery: ExternalToolSearchParams,
		@Query() pagination: PaginationParams,
		@Query() sortingQuery: SortExternalToolParams
	): Promise<ExternalToolSearchListResponse> {
		const options: IFindOptions<ExternalTool> = { pagination };
		options.order = this.externalToolDOMapper.mapSortingQueryToDomain(sortingQuery);
		const query: ExternalToolSearchQuery =
			this.externalToolDOMapper.mapExternalToolFilterQueryToExternalToolSearchQuery(filterQuery);

		const tools: Page<ExternalTool> = await this.externalToolUc.findExternalTool(currentUser.userId, query, options);

		const dtoList: ExternalToolResponse[] = tools.data.map(
			(tool: ExternalTool): ExternalToolResponse => ExternalToolResponseMapper.mapToExternalToolResponse(tool)
		);
		const response: ExternalToolSearchListResponse = new ExternalToolSearchListResponse(
			dtoList,
			tools.total,
			pagination.skip,
			pagination.limit
		);

		return response;
	}

	@Get(':externalToolId')
	@ApiOperation({ summary: 'Returns an ExternalTool for the given id' })
	async getExternalTool(
		@CurrentUser() currentUser: ICurrentUser,
		@Param() params: ExternalToolIdParams
	): Promise<ExternalToolResponse> {
		const externalTool: ExternalTool = await this.externalToolUc.getExternalTool(
			currentUser.userId,
			params.externalToolId
		);
		const mapped: ExternalToolResponse = ExternalToolResponseMapper.mapToExternalToolResponse(externalTool);

		return mapped;
	}

	@Post('/:externalToolId')
	@ApiOkResponse({ description: 'The Tool has been successfully updated.', type: ExternalToolResponse })
	@ApiForbiddenResponse()
	@ApiUnauthorizedResponse()
	@ApiResponse({ status: 400, type: ValidationError, description: 'Request data has invalid format.' })
	@ApiOperation({ summary: 'Updates an ExternalTool' })
	async updateExternalTool(
		@CurrentUser() currentUser: ICurrentUser,
		@Param() params: ExternalToolIdParams,
		@Body() externalToolParams: ExternalToolUpdateParams
	): Promise<ExternalToolResponse> {
		const externalTool: ExternalToolUpdate = this.externalToolDOMapper.mapUpdateRequest(externalToolParams);
		const updated: ExternalTool = await this.externalToolUc.updateExternalTool(
			currentUser.userId,
			params.externalToolId,
			externalTool
		);
		const mapped: ExternalToolResponse = ExternalToolResponseMapper.mapToExternalToolResponse(updated);
		this.logger.debug(`ExternalTool with id ${mapped.id} was updated by user with id ${currentUser.userId}`);

		return mapped;
	}

	@Delete(':externalToolId')
	@ApiForbiddenResponse({ description: 'User is not allowed to access this resource.' })
	@ApiUnauthorizedResponse({ description: 'User is not logged in.' })
	@ApiOperation({ summary: 'Deletes an ExternalTool' })
	@HttpCode(HttpStatus.NO_CONTENT)
	async deleteExternalTool(
		@CurrentUser() currentUser: ICurrentUser,
		@Param() params: ExternalToolIdParams
	): Promise<void> {
		const promise: Promise<void> = this.externalToolUc.deleteExternalTool(currentUser.userId, params.externalToolId);
		this.logger.debug(
			`ExternalTool with id ${params.externalToolId} was deleted by user with id ${currentUser.userId}`
		);

		return promise;
	}

	@Get('/:contextType/:contextId/references')
	@ApiOperation({ summary: 'Get ExternalTool References for a given context' })
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
			params.contextId,
			'/v3/tools/external-tools/{id}/logo'
		);

		const toolReferenceResponses: ToolReferenceResponse[] =
			ExternalToolResponseMapper.mapToToolReferenceResponses(toolReferences);
		const toolReferenceListResponse = new ToolReferenceListResponse(toolReferenceResponses);

		return toolReferenceListResponse;
	}

	@Get('/:externalToolId/logo')
	@ApiOperation({ summary: 'Gets the logo of an external tool.' })
	@ApiOkResponse({
		description: 'Logo of external tool fetched successfully.',
	})
	@ApiUnauthorizedResponse({ description: 'User is not logged in.' })
	async getExternalToolLogo(@Param() params: ExternalToolIdParams, @Res() res: Response): Promise<void> {
		const externalToolLogo: ExternalToolLogo = await this.externalToolUc.getExternalToolBinaryLogo(
			params.externalToolId
		);
		res.setHeader('Content-Type', externalToolLogo.contentType);
		res.setHeader('Cache-Control', 'must-revalidate');
		res.send(externalToolLogo.logo);
	}
}
