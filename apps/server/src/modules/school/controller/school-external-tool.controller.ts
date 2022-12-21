import { ApiTags, ApiUnauthorizedResponse } from '@nestjs/swagger';
import { Controller, Get, Param } from '@nestjs/common';
import { SchoolExternalToolDO } from '@shared/domain/domainobject/external-tool/school-external-tool.do';
import { SchoolExternalToolUc } from '../uc/school-external-tool.uc';
import { SchoolExternalToolParams } from './dto/school-external-tool.params';

@ApiTags('School')
// @Authenticate('jwt')
@Controller('school')
export class SchoolExternalToolController {
	constructor(private readonly schoolExternalToolUc: SchoolExternalToolUc) {}

	@Get(':schoolId/tool/:schoolExternalToolId')
	@ApiUnauthorizedResponse()
	async getSchoolExternalTool(
		// @CurrentUser() currentUser: ICurrentUser,
		@Param() toolParams: SchoolExternalToolParams
	): Promise<void> {
		const schoolExternalTool: SchoolExternalToolDO = await this.schoolExternalToolUc.getSchoolExternalTool(
			toolParams.schoolId,
			toolParams.schoolExternalToolId
		);
		// return TODO: map DO to response and return
	}
}
