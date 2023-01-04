import { ApiTags } from '@nestjs/swagger';
import { Controller, Get, Query } from '@nestjs/common';
import { ICurrentUser } from '@shared/domain';
import { ExternalToolDO } from '@shared/domain/domainobject/external-tool';
import { Authenticate, CurrentUser } from '../../authentication/decorator/auth.decorator';
import { ExternalToolResponseMapper } from './mapper';
import { IdQuery, ScopeQuery, ToolConfigurationListResponse } from './dto';
import { ExternalToolConfigurationUc } from '../uc/tool-configuration.uc';

@ApiTags('School')
@Authenticate('jwt')
@Controller('school')
export class ToolConfigurationController {
	constructor(
		private readonly externalToolConfigurationUc: ExternalToolConfigurationUc,
		private readonly externalToolMapper: ExternalToolResponseMapper
	) {}

	@Get('tools/available')
	async getAvailableToolsForSchool(
		@CurrentUser() currentUser: ICurrentUser,
		@Query() scopeQuery: ScopeQuery,
		@Query() idQuery: IdQuery
	): Promise<ToolConfigurationListResponse> {
		const availableTools: ExternalToolDO[] = await this.externalToolConfigurationUc.getAvailableToolsForSchool(
			currentUser.userId,
			idQuery.id
		);
		const mapped: ToolConfigurationListResponse =
			this.externalToolMapper.mapExternalToolDOsToToolConfigurationListResponse(availableTools);
		return mapped;
	}
}
