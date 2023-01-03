import { ApiTags } from '@nestjs/swagger';
import { Controller, Get, Param } from '@nestjs/common';
import { ICurrentUser } from '@shared/domain';
import { ExternalToolDO } from '@shared/domain/domainobject/external-tool';
import { Authenticate, CurrentUser } from '../../authentication/decorator/auth.decorator';
import { SchoolExternalToolListResponse, SchoolParams } from './dto';
import { SchoolExternalToolUc } from '../uc/school-external-tool.uc';
import { SchoolExternalToolMapper } from './mapper/school-external-tool.mapper';

@ApiTags('School')
@Authenticate('jwt')
@Controller('school')
export class SchoolExternalToolController {
	constructor(
		private readonly schoolExternalToolUc: SchoolExternalToolUc,
		private readonly schoolExternalToolMapper: SchoolExternalToolMapper
	) {}

	@Get(':schoolId/tools/available')
	async getAvailableToolsForSchool(
		@CurrentUser() currentUser: ICurrentUser,
		@Param() schoolParams: SchoolParams
	): Promise<SchoolExternalToolListResponse> {
		const availableTools: ExternalToolDO[] = await this.schoolExternalToolUc.getAvailableToolsForSchool(
			currentUser.userId,
			schoolParams.schoolId
		);
		const mapped: SchoolExternalToolListResponse =
			this.schoolExternalToolMapper.mapExternalToolDOsToSchoolExternalToolListResponse(availableTools);
		return mapped;
	}
}
