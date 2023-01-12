import { Controller, Get, Param } from '@nestjs/common';
import { ApiForbiddenResponse, ApiTags } from '@nestjs/swagger';
import { ICurrentUser } from '@shared/domain';
import { ExternalToolDO } from '@shared/domain/domainobject/external-tool';
import { Authenticate, CurrentUser } from '../../authentication/decorator/auth.decorator';
import { ExternalToolConfigurationUc } from '../uc/tool-configuration.uc';
import { IdParams, ScopeParams, ToolConfigurationListResponse } from './dto';
import { ExternalToolResponseMapper } from './mapper';

@ApiTags('Tool')
@Authenticate('jwt')
@Controller('tools')
export class ToolConfigurationController {
	constructor(
		private readonly externalToolConfigurationUc: ExternalToolConfigurationUc,
		private readonly externalToolMapper: ExternalToolResponseMapper
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
			this.externalToolMapper.mapExternalToolDOsToToolConfigurationListResponse(availableTools);
		return mapped;
	}
}
