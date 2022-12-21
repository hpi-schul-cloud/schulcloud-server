import { ApiTags, ApiUnauthorizedResponse } from '@nestjs/swagger';
import { Controller, Get, Param } from '@nestjs/common';
import { ICurrentUser } from '@shared/domain';
import { SchoolExternalToolDO } from '@shared/domain/domainobject/external-tool/school-external-tool.do';
import { Authenticate, CurrentUser } from '../../authentication/decorator/auth.decorator';
import { SchoolExternalToolUc } from '../uc/school-external-tool.uc';
import { SchoolParams } from './dto';

@ApiTags('School')
// @Authenticate('jwt')
@Controller('school')
export class SchoolExternalToolController {
	constructor(private readonly schoolExternalToolUc: SchoolExternalToolUc) {}

	@Get(':schoolId/tool/:toolId')
	@ApiUnauthorizedResponse()
	async getSchoolExternalTool(
		@CurrentUser() currentUser: ICurrentUser,
		@Param() schoolParams: SchoolParams
	): Promise<void> {
		const schoolExternalTool: SchoolExternalToolDO = await this.schoolExternalToolUc.getSchoolExternalTool(
			schoolParams.schoolId,
			schoolParams.schoolExternalToolId
		);
		// return TODO: map DO to response and return
	}
}
