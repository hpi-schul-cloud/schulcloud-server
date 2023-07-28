import {
	ApiCreatedResponse,
	ApiForbiddenResponse,
	ApiFoundResponse,
	ApiResponse,
	ApiOkResponse,
	ApiBadRequestResponse,
	ApiTags,
	ApiUnauthorizedResponse,
	ApiUnprocessableEntityResponse,
} from '@nestjs/swagger';
import { Body, Controller, Delete, Get, Param, Post, Query, Put } from '@nestjs/common';
import { ValidationError } from '@shared/common';
import { ICurrentUser } from '@src/modules/authentication';
import { LegacyLogger } from '@src/core/logger';
import { Authenticate, CurrentUser } from '@src/modules/authentication/decorator/auth.decorator';
import { SchoolExternalToolRequestMapper, SchoolExternalToolResponseMapper } from '../mapper';
import { ExternalToolSearchListResponse } from '../../external-tool/controller/dto';
import {
	SchoolExternalToolIdParams,
	SchoolExternalToolPostParams,
	SchoolExternalToolResponse,
	SchoolExternalToolSearchListResponse,
	SchoolExternalToolSearchParams,
} from './dto';
import { SchoolExternalTool } from '../uc/dto/school-external-tool.types';
import { SchoolExternalToolUc } from '../uc';
import { SchoolExternalToolDO } from '../domainobject';

@ApiTags('Tool')
@Authenticate('jwt')
@Controller('tools/school')
export class ToolSchoolController {
	constructor(
		private readonly schoolExternalToolUc: SchoolExternalToolUc,
		private readonly responseMapper: SchoolExternalToolResponseMapper,
		private readonly requestMapper: SchoolExternalToolRequestMapper,
		private readonly logger: LegacyLogger
	) {}

	@Get()
	@ApiFoundResponse({ description: 'SchoolExternalTools has been found.', type: ExternalToolSearchListResponse })
	@ApiForbiddenResponse()
	@ApiUnauthorizedResponse()
	async getSchoolExternalTools(
		@CurrentUser() currentUser: ICurrentUser,
		@Query() schoolExternalToolParams: SchoolExternalToolSearchParams
	): Promise<SchoolExternalToolSearchListResponse> {
		const found: SchoolExternalToolDO[] = await this.schoolExternalToolUc.findSchoolExternalTools(currentUser.userId, {
			schoolId: schoolExternalToolParams.schoolId,
		});
		const response: SchoolExternalToolSearchListResponse = this.responseMapper.mapToSearchListResponse(found);
		return response;
	}

	@Get(':schoolExternalToolId')
	@ApiForbiddenResponse()
	@ApiUnauthorizedResponse()
	async getSchoolExternalTool(
		@CurrentUser() currentUser: ICurrentUser,
		@Param() params: SchoolExternalToolIdParams
	): Promise<SchoolExternalToolResponse> {
		const schoolExternalToolDO: SchoolExternalToolDO = await this.schoolExternalToolUc.getSchoolExternalTool(
			currentUser.userId,
			params.schoolExternalToolId
		);
		const mapped: SchoolExternalToolResponse =
			this.responseMapper.mapToSchoolExternalToolResponse(schoolExternalToolDO);
		return mapped;
	}

	@Put('/:schoolExternalToolId')
	@ApiOkResponse({ description: 'The Tool has been successfully updated.', type: SchoolExternalToolResponse })
	@ApiForbiddenResponse()
	@ApiUnauthorizedResponse()
	@ApiBadRequestResponse({ type: ValidationError, description: 'Request data has invalid format.' })
	async updateSchoolExternalTool(
		@CurrentUser() currentUser: ICurrentUser,
		@Param() params: SchoolExternalToolIdParams,
		@Body() body: SchoolExternalToolPostParams
	): Promise<SchoolExternalToolResponse> {
		const schoolExternalTool: SchoolExternalTool = this.requestMapper.mapSchoolExternalToolRequest(body);
		const updated: SchoolExternalToolDO = await this.schoolExternalToolUc.updateSchoolExternalTool(
			currentUser.userId,
			params.schoolExternalToolId,
			schoolExternalTool
		);

		const mapped: SchoolExternalToolResponse = this.responseMapper.mapToSchoolExternalToolResponse(updated);
		this.logger.debug(`SchoolExternalTool with id ${mapped.id} was updated by user with id ${currentUser.userId}`);
		return mapped;
	}

	@Delete(':schoolExternalToolId')
	@ApiForbiddenResponse()
	@ApiUnauthorizedResponse()
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
	async createSchoolExternalTool(
		@CurrentUser() currentUser: ICurrentUser,
		@Body() body: SchoolExternalToolPostParams
	): Promise<SchoolExternalToolResponse> {
		const schoolExternalTool: SchoolExternalTool = this.requestMapper.mapSchoolExternalToolRequest(body);

		const createdSchoolExternalToolDO: SchoolExternalToolDO = await this.schoolExternalToolUc.createSchoolExternalTool(
			currentUser.userId,
			schoolExternalTool
		);

		const response: SchoolExternalToolResponse =
			this.responseMapper.mapToSchoolExternalToolResponse(createdSchoolExternalToolDO);

		this.logger.debug(`SchoolExternalTool with id ${response.id} was created by user with id ${currentUser.userId}`);

		return response;
	}
}
