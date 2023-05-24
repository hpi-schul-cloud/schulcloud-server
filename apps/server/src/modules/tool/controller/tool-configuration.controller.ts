import { Controller, Get, Param } from '@nestjs/common';
import { ApiForbiddenResponse, ApiFoundResponse, ApiTags, ApiUnauthorizedResponse } from '@nestjs/swagger';
import { ExternalToolDO } from '@shared/domain';
import { ICurrentUser } from '@src/modules/authentication';
import { Authenticate, CurrentUser } from '@src/modules/authentication/decorator/auth.decorator';
import { ExternalToolConfigurationUc } from '../uc';
import {
	ExternalToolConfigurationTemplateResponse,
	IdParams,
	ToolConfigurationListResponse,
	ToolIdParams,
} from './dto';
import { ContextParams } from './dto/request/context.params';
import { ExternalToolResponseMapper } from './mapper';

@ApiTags('Tool')
@Authenticate('jwt')
@Controller('tools')
export class ToolConfigurationController {
	constructor(
		private readonly externalToolConfigurationUc: ExternalToolConfigurationUc,
		private readonly externalToolResponseMapper: ExternalToolResponseMapper
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
	@ApiForbiddenResponse()
	public async getAvailableToolsForContext(
		@CurrentUser() currentUser: ICurrentUser,
		@Param() contextParams: ContextParams,
		@Param() idParams: IdParams
	): Promise<ToolConfigurationListResponse> {
		const availableTools: ExternalToolDO[] = await this.externalToolConfigurationUc.getAvailableToolsForContext(
			currentUser.userId,
			currentUser.schoolId,
			idParams.id,
			contextParams.context
		);

		const mapped: ToolConfigurationListResponse =
			this.externalToolResponseMapper.mapExternalToolDOsToToolConfigurationListResponse(availableTools);

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
