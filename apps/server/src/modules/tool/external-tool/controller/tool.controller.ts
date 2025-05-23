import { LegacyLogger } from '@core/logger';
import { CurrentUser, ICurrentUser, JwtAuthentication } from '@infra/auth-guard';
import {
	Body,
	Controller,
	Delete,
	Get,
	HttpCode,
	HttpStatus,
	Param,
	Post,
	Query,
	Res,
	StreamableFile,
} from '@nestjs/common';
import {
	ApiBadRequestResponse,
	ApiCreatedResponse,
	ApiForbiddenResponse,
	ApiFoundResponse,
	ApiNotFoundResponse,
	ApiOkResponse,
	ApiOperation,
	ApiResponse,
	ApiTags,
	ApiUnauthorizedResponse,
	ApiUnprocessableEntityResponse,
} from '@nestjs/swagger';
import { ValidationError } from '@shared/common/error';
import { PaginationParams } from '@shared/controller/dto';
import { Page } from '@shared/domain/domainobject';
import { IFindOptions } from '@shared/domain/interface';
import { Response } from 'express';
import { ExternalToolSearchQuery } from '../../common/interface';
import { ExternalToolUtilizationUc } from '../../tool-utilization';
import { ExternalToolUtilization } from '../../tool-utilization/domain';
import { ExternalTool } from '../domain';
import { ExternalToolLogo } from '../domain/external-tool-logo';

import { ExternalToolRequestMapper, ExternalToolResponseMapper, ExternalToolUtilizationMapper } from '../mapper';
import { ExternalToolLogoService } from '../service';
import { ExternalToolCreate, ExternalToolImportResult, ExternalToolUc, ExternalToolUpdate } from '../uc';
import {
	ExternalToolBulkCreateParams,
	ExternalToolCreateParams,
	ExternalToolIdParams,
	ExternalToolImportResultListResponse,
	ExternalToolResponse,
	ExternalToolSearchListResponse,
	ExternalToolSearchParams,
	ExternalToolUpdateParams,
	ExternalToolUtilizationResponse,
	SortExternalToolParams,
} from './dto';

@ApiTags('Tool')
@JwtAuthentication()
@Controller('tools/external-tools')
export class ToolController {
	constructor(
		private readonly externalToolUc: ExternalToolUc,
		private readonly externalToolUtilizationUc: ExternalToolUtilizationUc,
		private readonly externalToolDOMapper: ExternalToolRequestMapper,
		private readonly logger: LegacyLogger,
		private readonly externalToolLogoService: ExternalToolLogoService
	) {}

	@Post()
	@ApiCreatedResponse({ description: 'The Tool has been successfully created.', type: ExternalToolResponse })
	@ApiForbiddenResponse()
	@ApiUnprocessableEntityResponse()
	@ApiUnauthorizedResponse()
	@ApiResponse({ status: 400, type: ValidationError, description: 'Request data has invalid format.' })
	@ApiOperation({ summary: 'Creates an ExternalTool' })
	public async createExternalTool(
		@CurrentUser() currentUser: ICurrentUser,
		@Body() externalToolParams: ExternalToolCreateParams
	): Promise<ExternalToolResponse> {
		const externalTool: ExternalToolCreate = this.externalToolDOMapper.mapCreateRequest(externalToolParams);

		const created: ExternalTool = await this.externalToolUc.createExternalTool(currentUser.userId, externalTool);

		const mapped: ExternalToolResponse = ExternalToolResponseMapper.mapToExternalToolResponse(created);

		this.logger.debug(`ExternalTool with id ${mapped.id} was created by user with id ${currentUser.userId}`);

		return mapped;
	}

	@Post('/import')
	@ApiCreatedResponse({
		description: 'A list of Tools has been created.',
		type: ExternalToolImportResultListResponse,
	})
	@ApiForbiddenResponse({ description: 'User is not allowed to access this resource.' })
	@ApiUnauthorizedResponse({ description: 'User is not logged in.' })
	@ApiBadRequestResponse({ description: 'Request data has invalid format.' })
	@ApiOperation({ summary: 'Creates multiple ExternalTools at the same time.' })
	public async importExternalTools(
		@CurrentUser() currentUser: ICurrentUser,
		@Body() externalToolBulkParams: ExternalToolBulkCreateParams
	): Promise<ExternalToolImportResultListResponse> {
		const externalTools: ExternalToolCreate[] = this.externalToolDOMapper.mapBulkCreateRequest(externalToolBulkParams);

		const results: ExternalToolImportResult[] = await this.externalToolUc.importExternalTools(
			currentUser.userId,
			externalTools
		);

		const response: ExternalToolImportResultListResponse = ExternalToolResponseMapper.mapToImportResponse(results);

		return response;
	}

	@Get()
	@ApiFoundResponse({ description: 'Tools has been found.', type: ExternalToolSearchListResponse })
	@ApiUnauthorizedResponse()
	@ApiForbiddenResponse()
	@ApiOperation({ summary: 'Returns a list of ExternalTools' })
	public async findExternalTool(
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
	public async getExternalTool(
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
	public async updateExternalTool(
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
	public async deleteExternalTool(
		@CurrentUser() currentUser: ICurrentUser,
		@Param() params: ExternalToolIdParams
	): Promise<void> {
		const promise: Promise<void> = this.externalToolUc.deleteExternalTool(currentUser.userId, params.externalToolId);
		this.logger.debug(
			`ExternalTool with id ${params.externalToolId} was deleted by user with id ${currentUser.userId}`
		);

		return promise;
	}

	@Get('/:externalToolId/logo')
	@ApiOperation({ summary: 'Gets the logo of an external tool.' })
	@ApiOkResponse({
		description: 'Logo of external tool fetched successfully.',
	})
	@ApiUnauthorizedResponse({ description: 'User is not logged in.' })
	public async getExternalToolLogo(@Param() params: ExternalToolIdParams, @Res() res: Response): Promise<void> {
		const externalToolLogo: ExternalToolLogo = await this.externalToolLogoService.getExternalToolBinaryLogo(
			params.externalToolId
		);

		res.setHeader('Content-Type', externalToolLogo.contentType);
		res.setHeader('Cache-Control', 'must-revalidate');
		res.setHeader('X-Content-Type-Options', 'nosniff');
		res.setHeader('Content-Disposition', 'attachment');
		res.setHeader(
			'Content-Security-Policy',
			"default-src 'none'; script-src 'none'; connect-src 'none'; base-uri 'none'; form-action 'none'; object-src 'none'; frame-ancestors 'none'; img-src 'self' data:; style-src 'self' 'unsafe-inline'; font-src 'self' data:"
		);
		res.send(externalToolLogo.logo);
	}

	@Get('/:externalToolId/metadata')
	@ApiOperation({ summary: 'Gets the utilization of an external tool.' })
	@ApiOkResponse({
		description: 'Utilization of external tool fetched successfully.',
		type: ExternalToolUtilizationResponse,
	})
	@ApiUnauthorizedResponse({ description: 'User is not logged in.' })
	public async getUtilizationForExternalTool(
		@CurrentUser() currentUser: ICurrentUser,
		@Param() params: ExternalToolIdParams
	): Promise<ExternalToolUtilizationResponse> {
		const externalToolUtilization: ExternalToolUtilization =
			await this.externalToolUtilizationUc.getUtilizationForExternalTool(currentUser.userId, params.externalToolId);

		const mapped: ExternalToolUtilizationResponse =
			ExternalToolUtilizationMapper.mapToExternalToolUtilizationResponse(externalToolUtilization);

		return mapped;
	}

	@Get(':externalToolId/datasheet')
	@ApiOperation({ summary: 'Returns a pdf of the external tool information' })
	@ApiUnauthorizedResponse({ description: 'User is not logged in.' })
	@ApiNotFoundResponse({ description: 'The external tool has not been found' })
	public async getDatasheet(
		@CurrentUser() currentUser: ICurrentUser,
		@Param() params: ExternalToolIdParams,
		@Res({ passthrough: true }) res: Response
	): Promise<StreamableFile> {
		const datasheetBuffer: Buffer = await this.externalToolUc.getDatasheet(currentUser.userId, params.externalToolId);

		const myFilename = await this.externalToolUc.createDatasheetFilename(params.externalToolId);

		res.setHeader('Content-Type', 'application/pdf');
		res.setHeader('Content-Disposition', `inline; filename=${myFilename}`);

		const streamableFile: StreamableFile = new StreamableFile(datasheetBuffer);

		return streamableFile;
	}
}
