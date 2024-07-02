import { Authenticate, CurrentUser, ICurrentUser } from '@modules/authentication';
import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Post, Put, Query } from '@nestjs/common';
import {
	ApiBadRequestResponse,
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
import { LegacyLogger } from '@src/core/logger';
import { ExternalToolSearchListResponse } from '../../external-tool/controller/dto';
import { SchoolExternalTool, SchoolExternalToolMetadata, SchoolExternalToolProps } from '../domain';
import {
	SchoolExternalToolMetadataMapper,
	SchoolExternalToolRequestMapper,
	SchoolExternalToolResponseMapper,
} from '../mapper';
import { SchoolExternalToolUc } from '../uc';
import {
	SchoolExternalToolIdParams,
	SchoolExternalToolMetadataResponse,
	SchoolExternalToolPostParams,
	SchoolExternalToolResponse,
	SchoolExternalToolSearchListResponse,
	SchoolExternalToolSearchParams,
} from './dto';

@ApiTags('Tool')
@Authenticate('jwt')
@Controller('tools/school-external-tools')
export class ToolSchoolController {
	constructor(private readonly schoolExternalToolUc: SchoolExternalToolUc, private readonly logger: LegacyLogger) {}

	@Get()
	@ApiFoundResponse({ description: 'SchoolExternalTools has been found.', type: ExternalToolSearchListResponse })
	@ApiForbiddenResponse()
	@ApiUnauthorizedResponse()
	@ApiOperation({ summary: 'Returns a list of SchoolExternalTools for a given school' })
	async getSchoolExternalTools(
		@CurrentUser() currentUser: ICurrentUser,
		@Query() schoolExternalToolParams: SchoolExternalToolSearchParams
	): Promise<SchoolExternalToolSearchListResponse> {
		const found: SchoolExternalTool[] = await this.schoolExternalToolUc.findSchoolExternalTools(currentUser.userId, {
			schoolId: schoolExternalToolParams.schoolId,
		});
		const response: SchoolExternalToolSearchListResponse =
			SchoolExternalToolResponseMapper.mapToSearchListResponse(found);
		return response;
	}

	@Get(':schoolExternalToolId')
	@ApiForbiddenResponse()
	@ApiUnauthorizedResponse()
	@ApiOperation({ summary: 'Returns a SchoolExternalTool for the given id' })
	async getSchoolExternalTool(
		@CurrentUser() currentUser: ICurrentUser,
		@Param() params: SchoolExternalToolIdParams
	): Promise<SchoolExternalToolResponse> {
		const schoolExternalTool: SchoolExternalTool = await this.schoolExternalToolUc.getSchoolExternalTool(
			currentUser.userId,
			params.schoolExternalToolId
		);
		const mapped: SchoolExternalToolResponse =
			SchoolExternalToolResponseMapper.mapToSchoolExternalToolResponse(schoolExternalTool);
		return mapped;
	}

	@Put('/:schoolExternalToolId')
	@ApiOkResponse({ description: 'The Tool has been successfully updated.', type: SchoolExternalToolResponse })
	@ApiForbiddenResponse()
	@ApiUnauthorizedResponse()
	@ApiBadRequestResponse({ type: ValidationError, description: 'Request data has invalid format.' })
	@ApiOperation({ summary: 'Updates a SchoolExternalTool' })
	async updateSchoolExternalTool(
		@CurrentUser() currentUser: ICurrentUser,
		@Param() params: SchoolExternalToolIdParams,
		@Body() body: SchoolExternalToolPostParams
	): Promise<SchoolExternalToolResponse> {
		const schoolExternalToolDto: SchoolExternalToolProps =
			SchoolExternalToolRequestMapper.mapSchoolExternalToolRequest(body);
		const updated: SchoolExternalTool = await this.schoolExternalToolUc.updateSchoolExternalTool(
			currentUser.userId,
			params.schoolExternalToolId,
			schoolExternalToolDto
		);

		const mapped: SchoolExternalToolResponse =
			SchoolExternalToolResponseMapper.mapToSchoolExternalToolResponse(updated);
		this.logger.debug(`SchoolExternalTool with id ${mapped.id} was updated by user with id ${currentUser.userId}`);
		return mapped;
	}

	@Delete(':schoolExternalToolId')
	@ApiForbiddenResponse()
	@ApiUnauthorizedResponse()
	@ApiOperation({ summary: 'Deletes a SchoolExternalTool' })
	@HttpCode(HttpStatus.NO_CONTENT)
	async deleteSchoolExternalTool(
		@CurrentUser() currentUser: ICurrentUser,
		@Param() params: SchoolExternalToolIdParams
	): Promise<void> {
		await this.schoolExternalToolUc.deleteSchoolExternalTool(currentUser.userId, params.schoolExternalToolId);
		this.logger.debug(
			`SchoolExternalTool with id ${params.schoolExternalToolId} was deleted by user with id ${currentUser.userId}`
		);
	}

	@Post()
	@ApiCreatedResponse({
		description: 'The SchoolExternalTool has been successfully created.',
		type: SchoolExternalToolResponse,
	})
	@ApiForbiddenResponse()
	@ApiUnprocessableEntityResponse()
	@ApiUnauthorizedResponse()
	@ApiResponse({ status: 400, type: ValidationError, description: 'Request data has invalid format.' })
	@ApiOperation({ summary: 'Creates a SchoolExternalTool' })
	async createSchoolExternalTool(
		@CurrentUser() currentUser: ICurrentUser,
		@Body() body: SchoolExternalToolPostParams
	): Promise<SchoolExternalToolResponse> {
		const schoolExternalToolDto: SchoolExternalToolProps =
			SchoolExternalToolRequestMapper.mapSchoolExternalToolRequest(body);

		const createdSchoolExternalToolDO: SchoolExternalTool = await this.schoolExternalToolUc.createSchoolExternalTool(
			currentUser.userId,
			schoolExternalToolDto
		);

		const response: SchoolExternalToolResponse =
			SchoolExternalToolResponseMapper.mapToSchoolExternalToolResponse(createdSchoolExternalToolDO);

		this.logger.debug(`SchoolExternalTool with id ${response.id} was created by user with id ${currentUser.userId}`);

		return response;
	}

	@Get('/:schoolExternalToolId/metadata')
	@ApiOperation({ summary: 'Gets the metadata of an school external tool.' })
	@ApiOkResponse({
		description: 'Metadata of school external tool fetched successfully.',
		type: SchoolExternalToolMetadataResponse,
	})
	@ApiUnauthorizedResponse({ description: 'User is not logged in.' })
	async getMetaDataForExternalTool(
		@CurrentUser() currentUser: ICurrentUser,
		@Param() params: SchoolExternalToolIdParams
	): Promise<SchoolExternalToolMetadataResponse> {
		const schoolExternalToolMetadata: SchoolExternalToolMetadata =
			await this.schoolExternalToolUc.getMetadataForSchoolExternalTool(currentUser.userId, params.schoolExternalToolId);

		const mapped: SchoolExternalToolMetadataResponse =
			SchoolExternalToolMetadataMapper.mapToSchoolExternalToolMetadataResponse(schoolExternalToolMetadata);

		return mapped;
	}
}
