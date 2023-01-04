import { ApiTags, ApiUnauthorizedResponse } from '@nestjs/swagger';
import { Controller, Get, Param, Query } from '@nestjs/common';
import { ICurrentUser } from '@shared/domain';
import { ExternalToolDO } from '@shared/domain/domainobject/external-tool';
import { Authenticate, CurrentUser } from '../../authentication/decorator/auth.decorator';
import { ScopeQuery, ToolIdParams } from './dto';
import { ExternalToolConfigurationTemplateResponse } from './dto/response/external-tool-configuration-template.response';
import { ExternalToolResponseMapper } from './mapper';
import { ExternalToolConfigurationUc } from '../uc/external-tool-configuration.uc';

@ApiTags('Tool')
@Authenticate('jwt')
@Controller('tools')
export class ToolConfigurationController {
	constructor(
		private readonly externalToolConfigurationUc: ExternalToolConfigurationUc,
		private readonly externalResponseMapper: ExternalToolResponseMapper
	) {}

	@Get(':toolId/configuration')
	@ApiUnauthorizedResponse()
	async getExternalToolForScope(
		@CurrentUser() currentUser: ICurrentUser,
		@Param() params: ToolIdParams,
		@Query() scopeQuery: ScopeQuery
	): Promise<ExternalToolConfigurationTemplateResponse> {
		const externalToolDO: ExternalToolDO = await this.externalToolConfigurationUc.getExternalToolForScope(
			currentUser.userId,
			params.toolId,
			scopeQuery.scope
		);
		const mapped: ExternalToolConfigurationTemplateResponse =
			this.externalResponseMapper.mapToConfigurationTemplateResponse(externalToolDO);
		return mapped;
	}
}
