import { ApiForbiddenResponse, ApiFoundResponse, ApiTags, ApiUnauthorizedResponse } from '@nestjs/swagger';
import { Controller, Get, Query } from '@nestjs/common';
import { ICurrentUser } from '@shared/domain';
import { SchoolExternalToolDO } from '@shared/domain/domainobject/external-tool/school-external-tool.do';
import { Authenticate, CurrentUser } from '../../authentication/decorator/auth.decorator';
import { SchoolExternalToolParams } from './dto/request/school-external-tool.params';
import { ExternalToolSearchListResponse } from './dto';
import { SchoolExternalToolSearchListResponse } from './dto/response/school-external-tool-search-list.response';
import { SchoolExternalToolUc } from '../uc/school-external-tool.uc';
import { SchoolExternalToolResponseMapper } from './mapper/school-external-tool-response.mapper';

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
		@Query() schoolExternalToolParams: SchoolExternalToolParams
	): Promise<SchoolExternalToolSearchListResponse> {
		const found: SchoolExternalToolDO[] = await this.schoolExternalToolUc.findSchoolExternalTools(currentUser.userId, {
			schoolId: schoolExternalToolParams.schoolId,
		});
		const response: SchoolExternalToolSearchListResponse = this.responseMapper.mapToSearchListResponse(found);
		return response;
	}
}
