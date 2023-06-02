import { Controller, Get, Param } from '@nestjs/common';
import {
	ApiBearerAuth,
	ApiForbiddenResponse,
	ApiFoundResponse,
	ApiOkResponse,
	ApiOperation,
	ApiTags,
	ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { ExternalToolDO } from '@shared/domain';
import { ICurrentUser } from '@src/modules/authentication';
import { Authenticate, CurrentUser } from '@src/modules/authentication/decorator/auth.decorator';
import { ExternalToolConfigurationUc } from '../uc';
import {
	ContextTypeParams,
	ExternalToolConfigurationTemplateResponse,
	SchoolToolConfigurationListResponse,
	IdParams,
	ToolConfigurationListResponse,
	ToolIdParams,
} from './dto';
import { ExternalToolResponseMapper, SchoolExternalToolResponseMapper } from './mapper';

@ApiTags('Tool')
@Authenticate('jwt')
@Controller('tools')
export class ToolConfigurationController {
	constructor(
		private readonly externalToolConfigurationUc: ExternalToolConfigurationUc,
		private readonly externalToolResponseMapper: ExternalToolResponseMapper,
		private readonly schoolExternalToolResponseMapper: SchoolExternalToolResponseMapper
	) {}

	@Get('available/school/:id')
	@ApiForbiddenResponse()
	public async getAvailableToolsForSchool(
		@CurrentUser() currentUser: ICurrentUser,
		@Param() idParams: IdParams
	): Promise<ToolConfigurationListResponse> {
		const availableTools: ExternalToolDO[] = await this.externalToolConfigurationUc.getAvailableToolsForSchool(
			currentUser.userId,
			idParams.id
		);

		const mapped: ToolConfigurationListResponse =
			this.externalToolResponseMapper.mapExternalToolDOsToToolConfigurationListResponse(availableTools);

		return mapped;
	}

	@Get('available/:context/:id')
	@ApiBearerAuth()
	@ApiForbiddenResponse()
	@ApiOperation({ summary: 'Lists all available tools that can be added for a given context' })
	@ApiOkResponse({
		description: 'List of available tools for a context',
		type: SchoolToolConfigurationListResponse,
	})
	public async getAvailableToolsForContext(
		@CurrentUser() currentUser: ICurrentUser,
		@Param() contextParams: ContextTypeParams,
		@Param() idParams: IdParams
	): Promise<SchoolToolConfigurationListResponse> {
		const [availableExternalTools, availableSchoolToolIds] =
			await this.externalToolConfigurationUc.getAvailableToolsForContext(
				currentUser.userId,
				currentUser.schoolId,
				idParams.id,
				contextParams.context
			);

		const mapped: SchoolToolConfigurationListResponse =
			this.schoolExternalToolResponseMapper.mapExternalToolDOsToSchoolToolConfigurationListResponse(
				availableExternalTools,
				availableSchoolToolIds
			);

		return mapped;
	}

	@Get(':toolId/configuration')
	@ApiUnauthorizedResponse()
	@ApiFoundResponse({ description: 'Configuration has been found.', type: ExternalToolConfigurationTemplateResponse })
	public async getExternalToolForScope(
		@CurrentUser() currentUser: ICurrentUser,
		@Param() params: ToolIdParams
	): Promise<ExternalToolConfigurationTemplateResponse> {
		const externalToolDO: ExternalToolDO = await this.externalToolConfigurationUc.getExternalToolForSchool(
			currentUser.userId,
			params.toolId,
			currentUser.schoolId
		);

		const mapped: ExternalToolConfigurationTemplateResponse =
			this.externalToolResponseMapper.mapToConfigurationTemplateResponse(externalToolDO);

		return mapped;
	}
}
