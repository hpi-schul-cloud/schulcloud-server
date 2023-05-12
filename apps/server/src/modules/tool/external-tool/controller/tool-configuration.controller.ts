import { Controller, Get, Param } from '@nestjs/common';
import { ApiForbiddenResponse, ApiFoundResponse, ApiTags, ApiUnauthorizedResponse } from '@nestjs/swagger';
import { ExternalToolDO } from '@shared/domain';
import { ICurrentUser } from '@src/modules/authentication';
import { Authenticate, CurrentUser } from '@src/modules/authentication/decorator/auth.decorator';
import { ExternalToolConfigurationTemplateResponse, ToolConfigurationListResponse } from './dto/response';
import { ExternalToolResponseMapper } from './mapper';
import { ExternalToolConfigurationUc } from '../uc';
import { IdParams, ScopeParams, ToolIdParams } from './dto/request';

@ApiTags('Tool')
@Authenticate('jwt')
@Controller('tools')
export class ToolConfigurationController {
	constructor(
		private readonly externalToolConfigurationUc: ExternalToolConfigurationUc,
		private readonly externalToolResponseMapper: ExternalToolResponseMapper
	) {}

	@Get('available/:scope/:id')
	@ApiForbiddenResponse()
	async getAvailableToolsForSchool(
		@CurrentUser() currentUser: ICurrentUser,
		@Param() scopeParams: ScopeParams,
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

	@Get(':toolId/configuration')
	@ApiUnauthorizedResponse()
	@ApiFoundResponse({ description: 'Configuration has been found.', type: ExternalToolConfigurationTemplateResponse })
	async getExternalToolForScope(
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
