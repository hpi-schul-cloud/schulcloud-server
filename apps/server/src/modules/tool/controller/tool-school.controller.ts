import { ApiForbiddenResponse, ApiFoundResponse, ApiTags, ApiUnauthorizedResponse } from '@nestjs/swagger';
import { Controller, Delete, Get, Param, Query } from '@nestjs/common';
import { ICurrentUser } from '@shared/domain';
import { SchoolExternalToolDO } from '@shared/domain/domainobject/external-tool/school-external-tool.do';
import { Authenticate, CurrentUser } from '../../authentication/decorator/auth.decorator';
import { SchoolExternalToolSearchParams } from './dto/request/school-external-tool-search.params';
import { ExternalToolSearchListResponse } from './dto';
import { SchoolExternalToolSearchListResponse } from './dto/response/school-external-tool-search-list.response';
import { SchoolExternalToolUc } from '../uc/school-external-tool.uc';
import { SchoolExternalToolResponseMapper } from './mapper/school-external-tool-response.mapper';
import { SchoolExternalToolIdParams } from './dto/request/school-external-tool-id.params';

@ApiTags('Tool')
@Authenticate('jwt')
@Controller('tools/school')
export class ToolSchoolController {
	constructor(
		private readonly schoolExternalToolUc: SchoolExternalToolUc,
		private readonly responseMapper: SchoolExternalToolResponseMapper
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

	@Delete(':schoolExternalToolId')
	@ApiForbiddenResponse()
	@ApiUnauthorizedResponse()
	async deleteSchoolExternalTool(
		@CurrentUser() currentUser: ICurrentUser,
		@Param() params: SchoolExternalToolIdParams
	): Promise<void> {
		await this.schoolExternalToolUc.deleteSchoolExternalTool(currentUser.userId, params.schoolExternalToolId);
	}
}
