import { ApiTags, ApiUnauthorizedResponse } from '@nestjs/swagger';
import { Controller, Get, Param } from '@nestjs/common';
import { SchoolExternalToolDO } from '@shared/domain/domainobject/external-tool/school-external-tool.do';
import { ICurrentUser } from '@shared/domain';
import { SchoolExternalToolUc } from '../uc/school-external-tool.uc';
import { SchoolExternalToolParams } from './dto/school-external-tool.params';
import { SchoolExternalToolResponse } from './dto/response/school-external-tool.response';
import { SchoolExternalToolResponseMapper } from './mapper/school-external-tool-response.mapper';
import { Authenticate, CurrentUser } from '../../authentication/decorator/auth.decorator';

@ApiTags('School')
@Authenticate('jwt')
@Controller('school')
export class SchoolExternalToolController {
	constructor(
		private readonly schoolExternalToolUc: SchoolExternalToolUc,
		private readonly schoolExternalToolResponseMapper: SchoolExternalToolResponseMapper
	) {}

	@Get(':schoolId/tool/:schoolExternalToolId')
	@ApiUnauthorizedResponse()
	async getSchoolExternalTool(
		@CurrentUser() currentUser: ICurrentUser,
		@Param() toolParams: SchoolExternalToolParams
	): Promise<SchoolExternalToolResponse> {
		const schoolExternalTool: SchoolExternalToolDO = await this.schoolExternalToolUc.getSchoolExternalTool(
			toolParams.schoolId,
			toolParams.schoolExternalToolId
		);
		const response: SchoolExternalToolResponse =
			this.schoolExternalToolResponseMapper.mapToResponse(schoolExternalTool);
		return response;
	}
}
