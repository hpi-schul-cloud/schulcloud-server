import {
	ApiCreatedResponse,
	ApiForbiddenResponse,
	ApiFoundResponse,
	ApiResponse,
	ApiTags,
	ApiUnauthorizedResponse,
	ApiUnprocessableEntityResponse,
} from '@nestjs/swagger';
import { Body, Controller, Delete, Get, Param, Post, Query } from '@nestjs/common';
import { ICurrentUser } from '@src/modules/authentication';
import { SchoolExternalToolDO } from '@shared/domain/domainobject/external-tool/school-external-tool.do';
import { Logger } from '@src/core/logger';
import { Authenticate, CurrentUser } from '@src/modules/authentication/decorator/auth.decorator';
import { ValidationError } from '@shared/common';
import {
	ExternalToolSearchListResponse,
	SchoolExternalToolIdParams,
	SchoolExternalToolPostParams,
	SchoolExternalToolResponse,
	SchoolExternalToolSearchListResponse,
	SchoolExternalToolSearchParams,
} from './dto';
import { SchoolExternalToolUc } from '../uc/school-external-tool.uc';
import { SchoolExternalToolRequestMapper, SchoolExternalToolResponseMapper } from './mapper';
import { SchoolExternalTool } from '../uc/dto/school-external-tool.types';

@ApiTags('Tool')
@Authenticate('jwt')
@Controller('tools/school')
export class ToolSchoolController {
	constructor(
		private readonly schoolExternalToolUc: SchoolExternalToolUc,
		private readonly responseMapper: SchoolExternalToolResponseMapper,
		private readonly requestMapper: SchoolExternalToolRequestMapper,
		private readonly logger: Logger
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
